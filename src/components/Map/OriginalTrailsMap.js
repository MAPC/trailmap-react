import React, { useState, useContext } from "react";
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl, Popup } from "react-map-gl";
import axios from "axios";
import BasemapIcon from "../../assets/icons/basemap-icon.svg";
import BasemapPanel from "../BasemapPanel";
import Control from "./Control";
import ControlPanelShell from "../ControlPanel/ControlPanelShell";
import MAhouseDistrictsButton from '../MAhouseDistrictsButton';
import MASenateDistrictsButton from '../MASenateDistrictsButton';
import MunicipalitiesButton from '../MunicipalitiesButton';
import Identify from "./Identify";
import { LayerContext } from "../../App";
import massachusettsData from "../../data/massachusetts.json";
import OriginalTrailsFilterLayers from "./layers/OriginalTrailsFilterLayers";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const TRAILMAP_SOURCE = process.env.REACT_APP_TRAIL_MAP_TILE_URL;
const LANDLINE_SOURCE = process.env.REACT_APP_LANDLINE_TILE_URL;
const TRAILMAP_IDENTIFY_SOURCE = process.env.REACT_APP_TRAIL_MAP_IDENTIFY_URL 


const OriginalTrailsMap = ({ 
  viewport, 
  setViewport, 
  baseLayer, 
  showBasemapPanel, 
  toggleBasemapPanel,
  showControlPanel,
  toggleControlPanel,
  mapRef,
  trailLayers: trailLayersProp,
  proposedLayers: proposedLayersProp,
  existingTrails: existingTrailsProp,
  proposedTrails: proposedTrailsProp,
}) => {
  const trailLayers = trailLayersProp || [];
  const proposedLayers = proposedLayersProp || [];
  const existingTrails = existingTrailsProp || [];
  const proposedTrails = proposedTrailsProp || [];
  const {
    showLandlineLayer,
    showMaHouseDistricts,
    showMaSenateDistricts,
    showMunicipalities,
    landlines,
    selectedMunicipality,
    setSelectedMunicipality,
    showMunicipalityView,
  } = useContext(LayerContext);

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
  React.useEffect(() => {
    if (showMunicipalities || showMaHouseDistricts || showMaSenateDistricts) {
      setShowOneLayerNotice(true);
    }
  }, [showMunicipalities, showMaHouseDistricts, showMaSenateDistricts]);

  // Auto-hide the one-layer notice after 2 seconds
  React.useEffect(() => {
    if (!showOneLayerNotice) return;
    const timer = setTimeout(() => setShowOneLayerNotice(false), 2000);
    return () => clearTimeout(timer);
  }, [showOneLayerNotice]);

  // Handle zoom transitions
  React.useEffect(() => {
    if (isZooming) {
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
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [isZooming]);

  // Clear hover states when identify popup closes
  React.useEffect(() => {
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
          />
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

  return (
    <ReactMapGL
      ref={mapRef}
      {...viewport}
      width="100%"
      height="100%"
      interactiveLayerIds={[
        "ma-house-districts-fill", 
        "ma-senate-districts-fill", 
        "municipalities-fill"
      ]}
      onMove={(event) => {
        const newViewport = event.viewState;
        if (Math.abs(newViewport.zoom - viewport.zoom) > 0.01) {
          setIsZooming(true);
        }
        setViewport(newViewport);
      }}
      onClick={(event) => {
        // Check if clicking on a municipality when municipalities layer is visible
        if (showMunicipalities && event.features) {
          const muniFeature = event.features.find((f) => f.layer && f.layer.id === "municipalities-fill");
          if (muniFeature) {
            const townName = muniFeature.properties.town || muniFeature.properties.NAME;
            if (townName) {
              const muniName = townName.toLowerCase();
              setSelectedMunicipality({
                name: muniName,
                properties: muniFeature.properties,
                geometry: muniFeature.geometry
              });
              return;
            }
          }
        }
        
        // Handle identify popup for trails
        const allLayers = [
          ...existingTrails.filter((et) => trailLayers.includes(et.id)).map((et) => et["esri-id"]),
          ...proposedTrails.filter((et) => proposedLayers.includes(et.id)).map((et) => et["esri-id"]),
        ].join(",");
        if (!allLayers) return;

        if (trailLayers.length > 0 || proposedLayers.length > 0) {
          const currentMap = mapRef.current?.getMap?.();
          if (!currentMap) return;
          const currentMapBounds = currentMap.getBounds();
          axios
            .get(TRAILMAP_IDENTIFY_SOURCE, {
              params: {
                geometry: `${event.lngLat.lng},${event.lngLat.lat}`,
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
              if (res?.data?.error) {
                console.error("Trail identify error:", res.data.error);
                return;
              }
              const results = res?.data?.results;
              if (results && results.length > 0) {
                const identifyResult = [];
                for (let i = 0; i < Math.min(5, results.length); i++) {
                  identifyResult.push(results[i]);
                }
                setIdentifyInfo(identifyResult);
                toggleIdentifyPopup(true);
                setIdentifyPoint(event.lngLat);
              }
            })
            .catch((err) => {
              console.error("Trail identify request failed:", err);
            });
        }
      }}
      onMouseMove={(event) => {
        const map = mapRef.current && mapRef.current.getMap ? mapRef.current.getMap() : null;
        const features = event.features || [];

        // Handle MA House Districts hover
        if (showMaHouseDistricts) {
          let districtFeature = features.find((f) => f.layer && f.layer.id === "ma-house-districts-fill");
          
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

        // Handle MA Senate Districts hover
        if (showMaSenateDistricts) {
          let senateFeature = features.find((f) => f.layer && f.layer.id === "ma-senate-districts-fill");
          
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

        // Handle Municipalities hover
        if (showMunicipalities) {
          let muniFeature = features.find((f) => f.layer && f.layer.id === "municipalities-fill");
          
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
      {showIdentifyPopup && identifyInfo && identifyInfo.length > 0 && identifyPoint && (
        <Identify
          point={identifyPoint}
          identifyResult={identifyInfo}
          handleShowPopup={() => {
            toggleIdentifyPopup(false);
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
        />
      )}
      
      <ControlPanelShell
        showControlPanel={showControlPanel}
        toggleControlPanel={toggleControlPanel}
      />

      {showBasemapPanel && <BasemapPanel />}
      
      {/* Render vector tile source for original trails filters */}
      <Source id="MAPC trail vector tiles" type="vector" tiles={[TRAILMAP_SOURCE]}>
        <OriginalTrailsFilterLayers
          trailLayers={trailLayers}
          proposedLayers={proposedLayers}
          existingTrails={existingTrails}
          proposedTrails={proposedTrails}
        />
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
      <Control
        style={"Map_basemap d-block position-absolute m-0 p-0"}
        icon={BasemapIcon}
        alt={"Show Basemaps"}
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
  );
};

export default OriginalTrailsMap;

