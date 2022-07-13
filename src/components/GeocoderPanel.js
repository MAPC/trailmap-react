
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-map-gl-geocoder/dist/mapbox-gl-geocoder.css';
import React, { forwardRef } from 'react';
import GeocoderControl from './GeocoderControl';

const GeocoderPanel = forwardRef(({ MAPBOX_TOKEN }, ref) => {
  return (
    <GeocoderControl
      mapboxAccessToken={MAPBOX_TOKEN}
      position="top-left"
      ref={ref}
    />
  );

});

export default GeocoderPanel;