import BasemapIcon from "../../assets/icons/basemap-icon.svg"
import FilterIcon from "../../assets/icons/filter-icon.svg";
import ShareIcon from "../../assets/icons/share-icon.svg";
import Control from "./Control";
import React, { useState, useRef, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl } from "react-map-gl";
import BasemapPanel from "../BasemapPanel";
import ControlPanel from "../ControlPanel";
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import ShareModal from "../Modals/ShareModal";
import GlossaryModal from "../Modals/GlossaryModal";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const TRAILMAP_SOURCE = process.env.REACT_APP_TRAIL_MAP_TILE_URL;
const LANDLINE_SOURCE = process.env.REACT_APP_LANDLINE_TILE_URL;

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
  // const [bbox, setBox] = useState(null);
  const [showControlPanel, toggleControlPanel] = useState(true);
  const [showBasemapPanel, toggleBasemapPanel] = useState(false)

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
      }
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
          id={addLayer.id}
          type={addLayer.type}
          source="MAPC trail vector tiles"
          source-layer={addLayer["source-layer"]}
          paint={addLayer.paint}
          layout={addLayer.layout}>
        </Layer>
      )
    });
    return (visibleLayers);
  }
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
        )
      });
    }
    return (visibleLandlineLayers);
  }

  const generateShareUrl = () => {
    //sample URL
    //http://localhost:8080/?baseLayer=mapboxDark&trailLayers=pavedPaths,unimprovedPaths,bikeLane
    return `${window.location.href.split("?")[0]}?baseLayer=${baseLayer.id}&trailLayers=${trailLayers.join(",")}&centroid=${viewport.latitude},${viewport.longitude}&zoom=${viewport.zoom}`;
  }

  return (
    <>
      <ShareModal url={generateShareUrl()} />
      <GlossaryModal />
      <div className="Map">
        <ReactMapGL
          ref={mapRef}
          {...viewport}
          width="100%"
          height="100%"
          onMove={(event) => setViewport(event.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={baseLayer.url}
          scrollZoom={true}
          transitionDuration="1000"
        >
          {showControlPanel &&
            <ControlPanel />
          }
          {showBasemapPanel &&
            <BasemapPanel />
          }
          <Source
            id="MAPC trail vector tiles"
            type="vector"
            tiles={[TRAILMAP_SOURCE]} >
            {visibleLayers()}
          </Source>
          <Source
            id="MAPC landline vector tiles"
            type="vector"
            tiles={[LANDLINE_SOURCE]} >
            {landlineLayers()}
          </Source>
          <GeocoderPanel
            MAPBOX_TOKEN={MAPBOX_TOKEN}
          />
          <Control
            style={"Map_filter"}
            icon={FilterIcon}
            alt={"Show Control Panel"}
            clickHandler={() => toggleControlPanel(!showControlPanel)} />
          <Control
            style={"Map_share"}
            icon={ShareIcon}
            alt={"Share Map"}
            clickHandler={() => toggleShareModal(!showShareModal)} />
          <Control
            style={"Map_basemap"}
            icon={BasemapIcon}
            alt={"Show Baesmaps"}
            clickHandler={() => toggleBasemapPanel(!showBasemapPanel)} />
          <ScaleControl
            position="bottom-right"
          />
          <NavigationControl
            className="map_navigation"
            position="bottom-right" />
          <GeolocateControl
            className="map_geolocate"
            positionOptions={{ enableHighAccuracy: true }}
            showUserHeading={false}
            showAccuracyCircle={false}
            showUserLocation={true}
            trackUserLocation={false}
            position="bottom-right"
          />
        </ReactMapGL >
      </div>
    </>
  );
};

export default Map;