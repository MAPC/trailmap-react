import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import React, { useState, useRef, useCallback } from "react";
import ReactMapGL, { NavigationControl, GeolocateControl } from 'react-map-gl';
import ControlPanel from "./ControlPanel";
import LayerData from "../data/LayerData";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;

const Map = () => {
  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 8.5,
    transitionDuration: 1000
  });

  const [trailLayers, setTrailLayers] = useState([]);
  // const [baseLayers, setBaseLayers] = useState([]);
  
  const mapRef = useRef();

  const handleViewportChange = useCallback(
    (viewport) => setViewport(viewport), [],
  );

  const handleTrailLayers = (layer) => {
        trailLayers.includes(layer) ?
        setTrailLayers(current => current.filter(trailLayer => trailLayer !== layer)) :
        setTrailLayers(current => [...current, layer]);
  };

  return (
    <div className="Map">
        <ReactMapGL
          ref={mapRef}
          {...viewport}
          width="100%"
          height="100%"
          onMove={() => handleViewportChange()}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v9"
          scrollZoom={true}
          transitionDuration="1000"
        >
          <ControlPanel 
            ref={mapRef} 
            MAPBOX_TOKEN={MAPBOX_TOKEN} 
            layerData={LayerData.existing} 
            handleTrailLayers={handleTrailLayers}/>
          <NavigationControl position="bottom-right" />
          <GeolocateControl 
            positionOptions={{ enableHighAccuracy: true }}
            showUserHeading={false}
            showAccuracyCircle={false}
            showUserLocation={true}
            trackUserLocation={false}
            position="bottom-right"
          />
        </ReactMapGL>
      </div>
  );
};

export default Map;