import '../styles/control-panel.css'
import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import React, { useState, useRef, useCallback, useEffect } from "react";
import GeocoderControl from "./GeocoderControl";

const ControlPanel = ({mapRef, MAPBOX_TOKEN}) => {
  return (
    <div className="control-panel">
      <GeocoderControl 
        mapboxAccessToken={MAPBOX_TOKEN} 
        position="top-left" 
        ref={mapRef} 
      />
    </div>
  );
}

export default ControlPanel;
