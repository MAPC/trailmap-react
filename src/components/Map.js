import "mapbox-gl/dist/mapbox-gl.css";
import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactMapGL, { NavigationControl } from "react-map-gl";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;

const Map = () => {
  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 8.5,
    transitionDuration: 1000
  });
  const mapRef = useRef();
  useEffect(() => {
    if (mapRef && mapRef.current) {
      const map = mapRef.current.getMap();
    }
  }, []);
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
        onMove={handleViewportChange}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v9"
        scrollZoom={true}
      >
        <NavigationControl />
      </ReactMapGL>
    </div>
    </div>
  );
};

export default Map;