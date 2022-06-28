import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactMapGL, {NavigationControl, GeolocateControl} from 'react-map-gl';
import GeocoderControl from "./GeocoderControl";
import ControlPanel from "./ControlPanel";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;

const Map = () => {
  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 8.5,
    transitionDuration: 1000
  });
  
  const mapRef = useRef();

  const handleViewportChange = useCallback(
    (viewport) => setViewport(viewport), [],
  );

  return (
    <div className="map-wrapper">
      <div className="map-container">
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
          <NavigationControl />
          <GeolocateControl 
            positionOptions={{ enableHighAccuracy: true }}
            showUserHeading={false}
            showAccuracyCircle={false}
            showUserLocation={true}
            trackUserLocation={false}
          />
          <GeocoderControl mapboxAccessToken={MAPBOX_TOKEN} position="top-left" />
        </ReactMapGL>
      </div>
    </div>
  );
};

export default Map;