import '../styles/control-panel.css'
import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {NavigationControl, GeolocateControl} from 'react-map-gl';
import GeocoderControl from "./GeocoderControl";

const ControlPanel = ({mapRef, MAPBOX_TOKEN}) => {
  return (
    <div className="control-panel">
      <GeocoderControl 
        mapboxAccessToken={MAPBOX_TOKEN} 
        position="top-left" 
        ref={mapRef} 
      />
      <NavigationControl ref={mapRef} />
      <GeolocateControl 
        ref={mapRef}
        positionOptions={{ enableHighAccuracy: true }}
        showUserHeading={false}
        showAccuracyCircle={false}
        showUserLocation={true}
        trackUserLocation={false}
      />
    </div>
  );
}

export default ControlPanel;
