import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-map-gl-geocoder/dist/mapbox-gl-geocoder.css';
import React from 'react';
import GeocoderControl from './GeocoderControl';
import TypeButton from './TypeButton';

const ControlPanel = React.forwardRef(({ MAPBOX_TOKEN, layerData, handleTrailLayers }, ref) => {

  const renderTypeButton = layerData.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      handleTrailLayers={handleTrailLayers} />;
  });

  return (
    <div className="ControlPanel">
      <GeocoderControl
        mapboxAccessToken={MAPBOX_TOKEN}
        position="top-left"
        ref={ref}
      />
      <div>
        <h2>Find the trails that work for you!</h2>
        <p>Select from various trail types to find trails best suited to your needs.</p>
      </div>
      <div>
        <h2>Existing:</h2>
        {renderTypeButton}
      </div>
    </div>
  );
});

export default ControlPanel;
