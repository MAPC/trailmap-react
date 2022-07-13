import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import FilterIcon from "../assets/filter-icon.svg"
import React, { useState, useRef, useCallback } from "react";
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import GeocoderPanel from './GeocoderPanel';
import ControlPanel from "./ControlPanel";
import LayerData from "../data/LayerData";
import BasemapPanel from "./BasemapPanel";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const TRAILMAP_SOURCE = process.env.REACT_APP_TRAIL_MAP_TILE_URL;

const Map = () => {
  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 8.5,
    transitionDuration: 1000
  });

  const basemaps = LayerData.basemap;

  const [trailLayers, setTrailLayers] = useState([]);
  const [baseLayer, setBaseLayer] = useState(basemaps[0]);
  const [showControlPanel, toggleControlPanel] = useState(true)


  const mapRef = useRef();

  const visibleLayers = () => {
    const visibleLayers = [];
    trailLayers.forEach((layer, index) => {
      const addLayer = LayerData.existing.filter(l => l.id === layer)[0];
      visibleLayers.push(
        <Layer
          key={index}
          id={addLayer.id}
          type={addLayer.type}
          source="MAPC trail vector tiles"
          source-layer={addLayer['source-layer']}
          paint={addLayer.paint}
          layout={addLayer.layout}>
        </Layer>
      )
    });
    return (visibleLayers);
  }

  const handleViewportChange = useCallback(
    (viewport) => setViewport(viewport), [],
  );

  const handleTrailLayers = (layer) => {
    trailLayers.includes(layer) ?
      setTrailLayers(current => current.filter(trailLayer => trailLayer !== layer)) :
      setTrailLayers(current => [...current, layer]);
  };

  const handleBaseLayer = (layer) => {
    setBaseLayer(layer);
  }

  return (
    <div className="Map">
      <ReactMapGL
        ref={mapRef}
        {...viewport}
        width="100%"
        height="100%"
        onMove={() => handleViewportChange()}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={baseLayer.url}
        scrollZoom={true}
        transitionDuration="1000"
      >
        <GeocoderPanel
          MAPBOX_TOKEN={MAPBOX_TOKEN}
        />
        <button className="Map_filter_control"
          onClick={() => toggleControlPanel(!showControlPanel)}
        >
          <img src={FilterIcon} alt="Show Control Panel" />
        </button>
        <ControlPanel
          layerData={LayerData.existing}
          trailLayers={trailLayers}
          showPanel={showControlPanel}
          handleTrailLayers={handleTrailLayers} />
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
        <Source
          id="MAPC trail vector tiles"
          type="vector"
          tiles={[TRAILMAP_SOURCE]} >
          {visibleLayers()}
        </Source>
        <BasemapPanel
          basemaps={basemaps}
          handleBaseLayer={handleBaseLayer}
          baseLayer={baseLayer} />
      </ReactMapGL>
    </div >
  );
};

export default Map;