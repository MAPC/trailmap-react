import BasemapIcon from "../../assets/icons/basemap-icon.svg";
import FilterIcon from "../../assets/icons/filter-icon.svg";
import ShareIcon from "../../assets/icons/share-icon.svg";
import React, { useState, useRef, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import axios from 'axios';
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl } from "react-map-gl";
import BasemapPanel from "../BasemapPanel";
import Control from "./Control";
import ControlPanel from "../ControlPanel";
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import GlossaryModal from "../Modals/GlossaryModal";
import Identify from './Identify';
import ShareModal from "../Modals/ShareModal";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const TRAILMAP_SOURCE = process.env.REACT_APP_TRAIL_MAP_TILE_URL;
const LANDLINE_SOURCE = process.env.REACT_APP_LANDLINE_TILE_URL;
const TRAILMAP_IDENTIFY_SOURCE = process.env.REACT_APP_TRAIL_MAP_IDENTIFY_URL;

const Map = () => {
  const { showShareModal, toggleShareModal } = useContext(ModalContext);
  const { trailLayers, setTrailLayers, proposedLayers,
    baseLayer, setBaseLayer,
    showLandlineLayer,
    basemaps, existingTrails, proposedTrails, landlines } = useContext(LayerContext);

  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 10,
    transitionDuration: 1000
  });
  const [showBasemapPanel, toggleBasemapPanel] = useState(false);
  const [showControlPanel, toggleControlPanel] = useState(true);
  const [showIdentifyPopup, toggleIdentifyPopup] = useState(false);
  const [identifyInfo, setIdentifyInfo] = useState(null);
  const [identifyPoint, setIdentifyPoint] = useState(null);

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
        const paramBase = basemaps.find(bm => bm.id === params.baseLayer);
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

  const visibleLayers = () => {
    const visibleLayers = [];
    const allLayers = [...trailLayers, ...proposedLayers];
    allLayers.forEach((layer) => {
      const layerSet = layer.includes("Proposed") ? proposedTrails : existingTrails;
      const addLayer = layerSet.find(l => l.id === layer);
      visibleLayers.push(
        <Layer
          key={addLayer.id}
          esri_id={addLayer["esri-id"]}
          id={addLayer.id}
          type={addLayer.type}
          source="MAPC trail vector tiles"
          source-layer={addLayer["source-layer"]}
          paint={addLayer.paint}
          layout={addLayer.layout}>
        </Layer>
      );
    });
    return (visibleLayers);
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
            layout={layer.layout}>
          </Layer>
        );
      });
    }
    return (visibleLandlineLayers);
  };

  const generateShareUrl = () => {
    //sample URL
    //http://localhost:8080/?baseLayer=mapboxDark&trailLayers=pavedPaths,unimprovedPaths,bikeLane
    return `${window.location.href.split("?")[0]}?baseLayer=${baseLayer.id}&trailLayers=${trailLayers.join(",")}&centroid=${viewport.latitude},${viewport.longitude}&zoom=${viewport.zoom}`;
  };

  const getIdentifyPopup = (e) => {
    const allLayers = [
      ...existingTrails.filter(et => trailLayers.includes(et.id)).map(et => et['esri-id']),
      ...proposedTrails.filter(et => proposedLayers.includes(et.id)).map(et => et['esri-id']),
    ].join(',');
    if (trailLayers.length > 0 || proposedLayers.length > 0) {
      const currentMap = mapRef.current.getMap();
      const currentMapBounds = currentMap.getBounds();
      // https://geo.mapc.org:6443/arcgis/rest/services/transportation/AllTrails/MapServer/identify?geometry=-70.76687716085354,42.63667346474689&geometryType=esriGeometryPoint&sr=4326&layers=all&tolerance=3&mapExtent=-70.80280174812555,42.61677473648123,-70.75534438806021,42.64918646358444&imageDisplay=600%2C550%2C96&returnGeometry=true&returnZ=false&returnM=false&returnUnformattedValues=false&returnFieldName=false&f=pjson
      axios.get(TRAILMAP_IDENTIFY_SOURCE, {
        params: {
          geometry: `${e.lngLat.lng},${e.lngLat.lat}`,
          geometryType: 'esriGeometryPoint',
          sr: 4326,
          layers: allLayers,
          tolerance: 3,
          mapExtent: `${currentMapBounds._sw.lng},${currentMapBounds._sw.lat},${currentMapBounds._ne.lng},${currentMapBounds._ne.lat}`,
          imageDisplay: `600,550,96`,
          returnGeometry: false,
          f: 'pjson'
        }
      }).then((res) => {
        if (res.data.results.length > 0) {
          const identifyResult = res.data.results[0];
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
      <div className="Map position-relative">
        <ReactMapGL
          ref={mapRef}
          {...viewport}
          width="100%"
          height="100%"
          cursor="default"
          onMove={(event) => setViewport(event.viewState)}
          onClick={(event) => getIdentifyPopup(event)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={baseLayer.url}
          scrollZoom={true}
          transitionDuration="1000"
        >
          {showIdentifyPopup &&
            <Identify
              point={identifyPoint}
              identifyResult={identifyInfo}
              handleShowPopup={() => toggleIdentifyPopup(!showIdentifyPopup)}
            >
            </Identify>
          }
          {showControlPanel &&
            <ControlPanel />
          }
          {showBasemapPanel &&
            <BasemapPanel />
          }
          <Source
            id="MAPC trail vector tiles"
            type="vector"
            tiles={[TRAILMAP_SOURCE]}
          >
            {visibleLayers()}
          </Source>
          <Source
            id="MAPC landline vector tiles"
            type="vector"
            tiles={[LANDLINE_SOURCE]}
          >
            {landlineLayers()}
          </Source>
          <GeocoderPanel
            MAPBOX_TOKEN={MAPBOX_TOKEN}
          />
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
          <ScaleControl
            position="bottom-right"
          />
          <NavigationControl
            className="map_navigation"
            position="bottom-right"
          />
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