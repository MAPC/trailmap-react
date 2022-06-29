import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import React from "react";
import GeocoderControl from "./GeocoderControl";
import TypeButton from "./TypeButton";

const ControlPanel = ({mapRef, MAPBOX_TOKEN}) => {

  const layersData = [
    {
      id: "paved",
      label: "Paved Paths"
    }
  ]

  const renderLayers = layersData.map((layer, index) => {
    return <TypeButton key={index} layer={layer} />
  })

  return (
    <div className="control-panel">
      <GeocoderControl 
        mapboxAccessToken={MAPBOX_TOKEN} 
        position="top-left" 
        ref={mapRef}    
      />
      <div>
        <h2>Find the trails that work for you!</h2>
        <p>Select from various trail types to find trails best suited to your needs.</p>
      </div>
      <div>
        <h2>Type:</h2>
        {renderLayers}
      </div>
    </div>
  );
}

export default ControlPanel;
