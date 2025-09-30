import BasemapIcon from "../../assets/icons/basemap-icon.svg";
import FilterIcon from "../../assets/icons/filter-icon.svg";
import ShareIcon from "../../assets/icons/share-icon.svg";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import React, { useState, useRef, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl, Popup } from "react-map-gl";
import BasemapPanel from "../BasemapPanel";
import Control from "./Control";
import ControlPanel from "../ControlPanel";
import MAhouseDistrictsButton from '../MAhouseDistrictsButton';
import MASenateDistrictsButton from '../MASenateDistrictsButton';
import MunicipalitiesButton from '../MunicipalitiesButton';
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import GlossaryModal from "../Modals/GlossaryModal";
import Identify from "./Identify";
import ShareModal from "../Modals/ShareModal";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";
import EditModal from "../Modals/EditModal";
import massachusettsData from "../../data/massachusetts.json";
import SuccessModal from "../Modals/SuccessModal";
import FailModal from "../Modals/FailModal";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const TRAILMAP_SOURCE = process.env.REACT_APP_TRAIL_MAP_TILE_URL;
const LANDLINE_SOURCE = process.env.REACT_APP_LANDLINE_TILE_URL;
const TRAILMAP_IDENTIFY_SOURCE = process.env.REACT_APP_TRAIL_MAP_IDENTIFY_URL;

const Map = () => {
  const { showShareModal, toggleShareModal } = useContext(ModalContext);
  const {
    trailLayers,
    setTrailLayers,
    proposedLayers,
    baseLayer,
    setBaseLayer,
    showLandlineLayer,
    showMaHouseDistricts,
    showMaSenateDistricts,
    showMunicipalities,
    basemaps,
    existingTrails,
    proposedTrails,
    landlines,
  } = useContext(LayerContext);

  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 10,
    transitionDuration: 1000,
  });
  const [showBasemapPanel, toggleBasemapPanel] = useState(false);
  const [showControlPanel, toggleControlPanel] = useState(true);
  const [showIdentifyPopup, toggleIdentifyPopup] = useState(false);
  const [identifyInfo, setIdentifyInfo] = useState(null);
  const [identifyPoint, setIdentifyPoint] = useState(null);
  const [pointIndex, setPointIndex] = useState(0);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [hoverFeature, setHoverFeature] = useState(null);
  const [hoverFilterKey, setHoverFilterKey] = useState(null);
  const [hoverFilterValue, setHoverFilterValue] = useState(null);
  const [senateHoverPoint, setSenateHoverPoint] = useState(null);
  const [senateHoverFeature, setSenateHoverFeature] = useState(null);
  const [senateHoverFilterKey, setSenateHoverFilterKey] = useState(null);
  const [senateHoverFilterValue, setSenateHoverFilterValue] = useState(null);
  const [muniHoverPoint, setMuniHoverPoint] = useState(null);
  const [muniHoverFeature, setMuniHoverFeature] = useState(null);
  const [muniHoverFilterKey, setMuniHoverFilterKey] = useState(null);
  const [muniHoverFilterValue, setMuniHoverFilterValue] = useState(null);
  const [showOneLayerNotice, setShowOneLayerNotice] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  // Show notice when any one of the exclusive layers turns on
  useEffect(() => {
    if (showMunicipalities || showMaHouseDistricts || showMaSenateDistricts) {
      setShowOneLayerNotice(true);
    }
  }, [showMunicipalities, showMaHouseDistricts, showMaSenateDistricts]);

  // Auto-hide the one-layer notice after 2 seconds when shown
  useEffect(() => {
    if (!showOneLayerNotice) return;
    const timer = setTimeout(() => setShowOneLayerNotice(false), 2000);
    return () => clearTimeout(timer);
  }, [showOneLayerNotice]);

  // Handle zoom transitions and clear hover states after zoom completes
  useEffect(() => {
    if (isZooming) {
      // Set a timer to clear hover states after zoom transition completes
      const timer = setTimeout(() => {
        setHoverFeature(null);
        setHoverPoint(null);
        setHoverFilterKey(null);
        setHoverFilterValue(null);
        setSenateHoverFeature(null);
        setSenateHoverPoint(null);
        setSenateHoverFilterKey(null);
        setSenateHoverFilterValue(null);
        setMuniHoverFeature(null);
        setMuniHoverPoint(null);
        setMuniHoverFilterKey(null);
        setMuniHoverFilterValue(null);
        setIsZooming(false);
      }, 1100); // Slightly longer than transitionDuration (1000ms)
      
      return () => clearTimeout(timer);
    }
  }, [isZooming]);

  // Clear hover states when identify popup closes to fix hover detection
  useEffect(() => {
    if (!showIdentifyPopup) {
      setHoverFeature(null);
      setHoverPoint(null);
      setHoverFilterKey(null);
      setHoverFilterValue(null);
      setSenateHoverFeature(null);
      setSenateHoverPoint(null);
      setSenateHoverFilterKey(null);
      setSenateHoverFilterValue(null);
      setMuniHoverFeature(null);
      setMuniHoverPoint(null);
      setMuniHoverFilterKey(null);
      setMuniHoverFilterValue(null);
    }
  }, [showIdentifyPopup]);

  const mapRef = useRef();

  const [searchParams, _setSearchParams] = useSearchParams();

  useEffect(() => {
    //http://localhost:8080/?baseLayer=mapboxDark&trailLayers=pavedPaths,unimprovedPaths,bikeLane
    const setMapParam = () => {
      const paramsToObject = (entries) => {
        const result = {};
        for (const [key, value] of entries) {
          result[key] = value;
        }
        return result;
      };
      const params = paramsToObject(searchParams.entries());
      if (!!params.baseLayer) {
        const paramBase = basemaps.find((bm) => bm.id === params.baseLayer);
        setBaseLayer(paramBase);
      }
      if (!!params.trailLayers) {
        setTrailLayers(params.trailLayers.split(","));
      }
      if (!!params.zoom && !!params.centroid) {
        let newViewport = viewport;
        newViewport.zoom = params.zoom;
        newViewport.latitude = params.centroid.split(",")[0];
        newViewport.longitude = params.centroid.split(",")[1];
        setViewport(newViewport);
      }
    };
    setMapParam();
  }, []);

  // Ensure Legislative Districts and Municipalities layers persist across basemap changes
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Force re-render of legislative districts layers when basemap changes
      if (showMaHouseDistricts) {
        if (map.getLayer('ma-house-districts-fill')) {
          map.removeLayer('ma-house-districts-fill');
        }
        if (map.getLayer('ma-house-districts-outline')) {
          map.removeLayer('ma-house-districts-outline');
        }
        if (map.getLayer('ma-house-districts-labels')) {
          map.removeLayer('ma-house-districts-labels');
        }
      }

      // Force re-render of senate districts layers when basemap changes
      if (showMaSenateDistricts) {
        if (map.getLayer('ma-senate-districts-fill')) {
          map.removeLayer('ma-senate-districts-fill');
        }
        if (map.getLayer('ma-senate-districts-hover')) {
          map.removeLayer('ma-senate-districts-hover');
        }
        if (map.getLayer('ma-senate-districts-lines')) {
          map.removeLayer('ma-senate-districts-lines');
        }
      }

      // Force re-render of municipalities layers when basemap changes
      if (showMunicipalities) {
        if (map.getLayer('municipalities-fill')) {
          map.removeLayer('municipalities-fill');
        }
        if (map.getLayer('municipalities-hover')) {
          map.removeLayer('municipalities-hover');
        }
        if (map.getLayer('municipalities-labels')) {
          map.removeLayer('municipalities-labels');
        }
      }
    }
  }, [baseLayer, showMaHouseDistricts, showMaSenateDistricts, showMunicipalities]);

  const visibleLayers = () => {
    const visibleLayers = [];
    const allLayers = [...trailLayers, ...proposedLayers];
    allLayers.forEach((layer) => {
      const layerSet = layer.includes("Proposed") ? proposedTrails : existingTrails;
      const addLayer = layerSet.find((l) => l.id === layer);
      visibleLayers.push(
        <Layer
          key={addLayer.id}
          esri_id={addLayer["esri-id"]}
          id={addLayer.id}
          type={addLayer.type}
          source="MAPC trail vector tiles"
          source-layer={addLayer["source-layer"]}
          paint={addLayer.paint}
          layout={addLayer.layout}
        ></Layer>
      );
    });
    return visibleLayers;
  };
  const landlineLayers = () => {
    const visibleLandlineLayers = [];
    if (showLandlineLayer) {
      landlines.reverse().forEach((layer) => {
        visibleLandlineLayers.push(
          <Layer
            key={layer.id}
            id={layer.id}
            type={layer.type}
            filter={layer.filter}
            source="MAPC landline vector tiles"
            source-layer={layer["source-layer"]}
            paint={layer.paint}
            layout={layer.layout}
          ></Layer>
        );
      });
    }
    return visibleLandlineLayers;
  };

  const maHouseDistrictsLayers = () => {
    const visibleMaHouseDistrictsLayers = [];
    if (showMaHouseDistricts) {
      visibleMaHouseDistrictsLayers.push(
        <Layer
          key="ma-house-districts-fill"
          id="ma-house-districts-fill"
          type="fill"
          source="ma-house-districts"
          paint={{
            "fill-color": "transparent",
            "fill-outline-color": "transparent"
          }}
        />
      );
      visibleMaHouseDistrictsLayers.push(
        <Layer
          key="ma-house-districts-hover"
          id="ma-house-districts-hover"
          type="fill"
          source="ma-house-districts"
          paint={{
            "fill-color": "rgba(255, 166, 0, 0.25)",
            "fill-outline-color": "black"
          }}
          filter={
            hoverFilterKey && hoverFilterValue !== null
              ? ["==", ["get", hoverFilterKey], hoverFilterValue]
              : ["==", ["get", "__none__"], "__no_match__"]
          }
        />
      );
      visibleMaHouseDistrictsLayers.push(
        <Layer
          key="ma-house-districts-lines"
          id="ma-house-districts-lines"
          type="line"
          source="ma-house-districts-lines"
          paint={{
            "line-color": "black",
            "line-width": 1.05
          }}
        />
      );
    }
    return visibleMaHouseDistrictsLayers;
  };

  const maSenateDistrictsLayers = () => {
    const visibleMaSenateDistrictsLayers = [];
    if (showMaSenateDistricts) {
      visibleMaSenateDistrictsLayers.push(
        <Layer
          key="ma-senate-districts-fill"
          id="ma-senate-districts-fill"
          type="fill"
          source="ma-senate-districts"
          paint={{
            "fill-color": "transparent",
            "fill-outline-color": "black"
          }}
        />
      );
      visibleMaSenateDistrictsLayers.push(
        <Layer
          key="ma-senate-districts-hover"
          id="ma-senate-districts-hover"
          type="fill"
          source="ma-senate-districts"
          paint={{
            "fill-color": "rgba(255, 166, 0, 0.25)",
            "fill-outline-color": "black"
          }}
          filter={
            senateHoverFilterKey && senateHoverFilterValue !== null
              ? ["==", ["get", senateHoverFilterKey], senateHoverFilterValue]
              : ["==", ["get", "__none__"], "__no_match__"]
          }
        />
      );
      visibleMaSenateDistrictsLayers.push(
        <Layer
          key="ma-senate-districts-lines"
          id="ma-senate-districts-lines"
          type="line"
          source="ma-senate-districts-lines"
          paint={{
            "line-color": "black",
            "line-width": 1.05
          }}
        />
      );
    }
    return visibleMaSenateDistrictsLayers;
  };

  const municipalitiesLayers = () => {
    const visibleMunicipalitiesLayers = [];
    if (showMunicipalities) {
      visibleMunicipalitiesLayers.push(
        <Layer
          key="municipalities-fill"
          id="municipalities-fill"
          type="fill"
          source="municipalities"
          paint={{
            "fill-color": "transparent",
            "fill-outline-color": "black"
          }}
        />
      );
      visibleMunicipalitiesLayers.push(
        <Layer
          key="municipalities-hover"
          id="municipalities-hover"
          type="fill"
          source="municipalities"
          paint={{
            "fill-color": "rgba(255, 166, 0, 0.25)",
            "fill-outline-color": "black"
          }}
          filter={
            muniHoverFilterKey && muniHoverFilterValue !== null
              ? ["==", ["get", muniHoverFilterKey], muniHoverFilterValue]
              : ["==", ["get", "__none__"], "__no_match__"]
          }
        />
      );
    }
    return visibleMunicipalitiesLayers;
  };

  const generateShareUrl = () => {
    //sample URL
    //http://localhost:8080/?baseLayer=mapboxDark&trailLayers=pavedPaths,unimprovedPaths,bikeLane
    return `${window.location.href.split("?")[0]}?baseLayer=${baseLayer.id}&trailLayers=${trailLayers.join(
      ","
    )}&centroid=${viewport.latitude},${viewport.longitude}&zoom=${viewport.zoom}`;
  };

  const getIdentifyPopup = (e) => {
    const allLayers = [
      ...existingTrails.filter((et) => trailLayers.includes(et.id)).map((et) => et["esri-id"]),
      ...proposedTrails.filter((et) => proposedLayers.includes(et.id)).map((et) => et["esri-id"]),
    ].join(",");
    if (trailLayers.length > 0 || proposedLayers.length > 0) {
      const currentMap = mapRef.current.getMap();
      const currentMapBounds = currentMap.getBounds();
      // https://geo.mapc.org:6443/arcgis/rest/services/transportation/AllTrails/MapServer/identify?geometry=-70.76687716085354,42.63667346474689&geometryType=esriGeometryPoint&sr=4326&layers=all&tolerance=3&mapExtent=-70.80280174812555,42.61677473648123,-70.75534438806021,42.64918646358444&imageDisplay=600%2C550%2C96&returnGeometry=true&returnZ=false&returnM=false&returnUnformattedValues=false&returnFieldName=false&f=pjson
      axios
        .get(TRAILMAP_IDENTIFY_SOURCE, {
          params: {
            geometry: `${e.lngLat.lng},${e.lngLat.lat}`,
            geometryType: "esriGeometryPoint",
            sr: 4326,
            layers: "visible:" + allLayers,
            tolerance: 3,
            mapExtent: `${currentMapBounds._sw.lng},${currentMapBounds._sw.lat},${currentMapBounds._ne.lng},${currentMapBounds._ne.lat}`,
            imageDisplay: `600,550,96`,
            returnGeometry: false,
            f: "pjson",
          },
        })
        .then((res) => {
          if (res.data.results.length > 0) {
            const identifyResult = [];
            for (let i = 0; i < Math.min(5, res.data.results.length); i++) {
              identifyResult.push(res.data.results[i]);
            }
            setIdentifyInfo(identifyResult);
            toggleIdentifyPopup(true);
            setIdentifyPoint(e.lngLat);
          }
        });
    }
  };
  return (
    <>
      <ShareModal url={generateShareUrl()} />
      <GlossaryModal />
      <EditModal trailObj={identifyInfo !== null ? identifyInfo[pointIndex] : null} />

      <SuccessModal />
      <FailModal />

      <div className="Map position-relative">
        <ReactMapGL
          ref={mapRef}
          {...viewport}
          width="100%"
          height="100%"
          cursor="default"
          interactiveLayerIds={["ma-house-districts-fill", "ma-senate-districts-fill", "municipalities-fill"]}
          onMove={(event) => {
            const newViewport = event.viewState;
            // Detect if zoom level changed to trigger hover state cleanup
            if (Math.abs(newViewport.zoom - viewport.zoom) > 0.01) {
              setIsZooming(true);
            }
            setViewport(newViewport);
          }}
          onClick={(event) => getIdentifyPopup(event)}
          onMouseMove={(event) => {
            const map = mapRef.current && mapRef.current.getMap ? mapRef.current.getMap() : null;
            const features = event.features || [];

            // Handle MA House Districts hover (improved detection)
            if (showMaHouseDistricts) {
              let districtFeature = features.find((f) => f.layer && f.layer.id === "ma-house-districts-fill");
              
              // Enhanced fallback using queryRenderedFeatures with larger radius
              if (!districtFeature && map) {
                const x = event.point.x;
                const y = event.point.y;
                const queried = map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], {
                  layers: ["ma-house-districts-fill"],
                });
                if (queried && queried.length > 0) {
                  districtFeature = queried[0];
                }
              }
              
              if (districtFeature) {
                setHoverFeature(districtFeature);
                setHoverPoint(event.lngLat);
                const props = districtFeature.properties || {};
                const key =
                  (props.REPDISTNUM !== undefined && "REPDISTNUM") ||
                  (props.DIST_CODE !== undefined && "DIST_CODE") ||
                  (props.OBJECTID !== undefined && "OBJECTID") ||
                  null;
                const value = key ? props[key] : null;
                setHoverFilterKey(key);
                setHoverFilterValue(value);
              } else {
                setHoverFeature(null);
                setHoverPoint(null);
                setHoverFilterKey(null);
                setHoverFilterValue(null);
              }
            }

            // Handle MA Senate Districts hover (improved detection)
            if (showMaSenateDistricts) {
              let senateFeature = features.find((f) => f.layer && f.layer.id === "ma-senate-districts-fill");
              
              // Enhanced fallback using queryRenderedFeatures with larger radius
              if (!senateFeature && map) {
                const x = event.point.x;
                const y = event.point.y;
                const queried = map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], {
                  layers: ["ma-senate-districts-fill"],
                });
                if (queried && queried.length > 0) {
                  senateFeature = queried[0];
                }
              }
              
              if (senateFeature) {
                setSenateHoverFeature(senateFeature);
                setSenateHoverPoint(event.lngLat);
                const props = senateFeature.properties || {};
                const key =
                  (props.DIST_CODE !== undefined && "DIST_CODE") ||
                  (props.OBJECTID !== undefined && "OBJECTID") ||
                  null;
                const value = key ? props[key] : null;
                setSenateHoverFilterKey(key);
                setSenateHoverFilterValue(value);
              } else {
                setSenateHoverFeature(null);
                setSenateHoverPoint(null);
                setSenateHoverFilterKey(null);
                setSenateHoverFilterValue(null);
              }
            }

            // Handle Municipalities hover (improved detection)
            if (showMunicipalities) {
              let muniFeature = features.find((f) => f.layer && f.layer.id === "municipalities-fill");
              
              // Enhanced fallback using queryRenderedFeatures with larger radius
              if (!muniFeature && map) {
                const x = event.point.x;
                const y = event.point.y;
                const queried = map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], {
                  layers: ["municipalities-fill"],
                });
                if (queried && queried.length > 0) {
                  muniFeature = queried[0];
                }
              }
              
              if (muniFeature) {
                setMuniHoverFeature(muniFeature);
                setMuniHoverPoint(event.lngLat);
                const props = muniFeature.properties || {};
                const key =
                  (props.town !== undefined && "town") ||
                  (props.NAME !== undefined && "NAME") ||
                  (props.OBJECTID !== undefined && "OBJECTID") ||
                  null;
                const value = key ? props[key] : null;
                setMuniHoverFilterKey(key);
                setMuniHoverFilterValue(value);
              } else {
                setMuniHoverFeature(null);
                setMuniHoverPoint(null);
                setMuniHoverFilterKey(null);
                setMuniHoverFilterValue(null);
              }
            }
          }}
          onMouseLeave={() => {
            setHoverFeature(null);
            setHoverPoint(null);
            setHoverFilterKey(null);
            setHoverFilterValue(null);
            setSenateHoverFeature(null);
            setSenateHoverPoint(null);
            setSenateHoverFilterKey(null);
            setSenateHoverFilterValue(null);
            setMuniHoverFeature(null);
            setMuniHoverPoint(null);
            setMuniHoverFilterKey(null);
            setMuniHoverFilterValue(null);
          }}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={baseLayer.url}
          scrollZoom={true}
          transitionDuration="1000"
        >
          {showIdentifyPopup && (
            <Identify
              point={identifyPoint}
              identifyResult={identifyInfo}
              handleShowPopup={() => {
                toggleIdentifyPopup(false);
                // Clear all hover states when popup closes to fix hover detection
                setHoverFeature(null);
                setHoverPoint(null);
                setHoverFilterKey(null);
                setHoverFilterValue(null);
                setSenateHoverFeature(null);
                setSenateHoverPoint(null);
                setSenateHoverFilterKey(null);
                setSenateHoverFilterValue(null);
                setMuniHoverFeature(null);
                setMuniHoverPoint(null);
                setMuniHoverFilterKey(null);
                setMuniHoverFilterValue(null);
              }}
              handleCarousel={setPointIndex}
            ></Identify>
          )}
          {showControlPanel && (
            <div>
              <ControlPanel />
              <CloseButton
                id="control-close-btn"
                onClick={() => {
                  toggleControlPanel(false);
                }}
              />
            </div>
          )}

          {!showControlPanel && (
            <Button
              id="control-open-btn"
              onClick={() => {
                toggleControlPanel(true);
              }}
            >
              <img src={FilterIcon} alt={"Show Control Panel"} />
            </Button>
          )}
          {showBasemapPanel && <BasemapPanel />}
          
          <Source id="MAPC trail vector tiles" type="vector" tiles={[TRAILMAP_SOURCE]}>
            {visibleLayers()}
          </Source>
          <Source id="MAPC landline vector tiles" type="vector" tiles={[LANDLINE_SOURCE]}>
            {landlineLayers()}
          </Source>
          <Source 
            id="ma-house-districts" 
            type="geojson" 
            data="https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/House2021/MapServer/1/query?where=1%3D1&outFields=*&f=geojson"
          >
            {maHouseDistrictsLayers()}
          </Source>
          {showMaHouseDistricts && (
            <Source 
              id="ma-house-districts-lines" 
              type="geojson" 
              data="https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/House2021/MapServer/0/query?where=1%3D1&outFields=*&f=geojson"
            />
          )}
          <Source 
            id="ma-senate-districts" 
            type="geojson" 
            data="https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Senate2021/MapServer/1/query?where=1%3D1&outFields=*&f=geojson"
          >
            {maSenateDistrictsLayers()}
          </Source>
          {showMaSenateDistricts && (
            <Source 
              id="ma-senate-districts-lines" 
              type="geojson" 
              data="https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Senate2021/MapServer/0/query?where=1%3D1&outFields=*&f=geojson"
            />
          )}
          <Source 
            id="municipalities" 
            type="geojson" 
            data={massachusettsData}
          >
            {municipalitiesLayers()}
          </Source>
          <GeocoderPanel MAPBOX_TOKEN={MAPBOX_TOKEN} />
          <Control
            style={"Map_filter d-block position-absolute m-0 p-0"}
            icon={FilterIcon}
            alt={"Show Control Panel"}
            clickHandler={() => toggleControlPanel(!showControlPanel)}
          />
          <Control
            style={"Map_share d-block position-absolute m-0 p-0"}
            icon={ShareIcon}
            alt={"Share Map"}
            clickHandler={() => toggleShareModal(!showShareModal)}
          />
          <Control
            style={"Map_basemap d-block position-absolute m-0 p-0"}
            icon={BasemapIcon}
            alt={"Show Baesmaps"}
            clickHandler={() => toggleBasemapPanel(!showBasemapPanel)}
          />
          {showMaHouseDistricts && hoverFeature && hoverPoint && (
            <Popup
              longitude={hoverPoint.lng}
              latitude={hoverPoint.lat}
              closeButton={false}
              closeOnMove={true}
              anchor="top"
              offset={12}
            >
              {(() => {
              
                const p = hoverFeature.properties || {};
                console.log("showMaHouseDistricts", p);
                const repName = p.REP || "";
                const distName = p.REP_DIST || "";
                const distNum = p.DIST_CODE || "";
                return (
                  <div style={{minWidth: 160, color: '#2774bd'}}>
                    {repName && <div style={{fontWeight: 600}}>Representative Name: {repName}</div>}
                    {distName && <div>District: {distName}</div>}
                    {distNum && <div>District Code: #{distNum}</div>}
                  </div>
                );
              })()}
            </Popup>
          )}
          {showMaSenateDistricts && senateHoverFeature && senateHoverPoint && (
            <Popup
              longitude={senateHoverPoint.lng}
              latitude={senateHoverPoint.lat}
              closeButton={false}
              closeOnMove={true}
              anchor="top"
              offset={12}
            >
              {(() => {
                
                const p = senateHoverFeature.properties || {};
                console.log("showMaSenateDistricts", p);
                const repName = p.SENATOR || "";
                const distName = p.SEN_DIST || "";
                const distNum = p.SENDISTNUM || "";
                return (
                  <div style={{minWidth: 160, color: '#2774bd'}}>
                    {repName && <div style={{fontWeight: 600}}>Senator: {repName}</div>}
                    {distName && <div>Senate District: {distName}</div>}
                    {distNum && <div>Senate District Number: #{distNum}</div>}
                  </div>
                );
              })()}
            </Popup>
          )}
          {showMunicipalities && muniHoverFeature && muniHoverPoint && (
            <Popup
              longitude={muniHoverPoint.lng}
              latitude={muniHoverPoint.lat}
              closeButton={false}
              closeOnMove={true}
              anchor="top"
              offset={12}
            >
              {(() => {
                const p = muniHoverFeature.properties || {};
                const townName = p.town || "N/A";
                const capitalizedTownName = townName && townName !== "N/A" ? townName.charAt(0).toUpperCase() + townName.slice(1).toLowerCase() : townName;
                return (
                  <div style={{minWidth: 160, color: '#2774bd'}}>
                    {capitalizedTownName && <div style={{fontWeight: 400}}>Municipality: {capitalizedTownName}</div>}
                  </div>
                );
              })()}
            </Popup>
          )}
          <MunicipalitiesButton />
          <MASenateDistrictsButton />
          <MAhouseDistrictsButton />
          {showOneLayerNotice && (showMunicipalities || showMaHouseDistricts || showMaSenateDistricts) && (
            <div
              className="Map_oneLayerNotice position-absolute"
              style={{
                top: 117,
                right: 11,
                background: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12,
                color: "#333",
                zIndex: 1000
              }}
              onClick={() => setShowOneLayerNotice(false)}
            >
              For clarity, only one map (Municipalities, MA Senate, or MA House) is shown at a time
            </div>
          )}
          <ScaleControl position="bottom-right" />
          <NavigationControl className="map_navigation" position="bottom-right" />
          <GeolocateControl
            className="map_geolocate"
            positionOptions={{ enableHighAccuracy: true }}
            showUserHeading={false}
            showAccuracyCircle={false}
            showUserLocation={true}
            trackUserLocation={false}
            position="bottom-right"
          />
        </ReactMapGL>
      </div>
    </>
  );
};

export default Map;
