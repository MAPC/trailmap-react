import 'mapbox-gl/dist/mapbox-gl.css';
import React from 'react';
import TypeButton from './TypeButton';

const ControlPanel = ({ layerData, showPanel, handleTrailLayers, trailLayers }) => {

  const renderTypeButton = layerData.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      trailLayers={trailLayers}
      handleTrailLayers={handleTrailLayers} />;
  });

  return (
    <>
      {showPanel &&
        <div className="ControlPanel" >
          <><div>
            <h2>Find the trails that work for you!</h2>
            <p>Select from various trail types to find trails best suited to your needs.</p>
          </div><div>
              <h2>Existing:</h2>
              {renderTypeButton}
            </div></>
        </div >
      }
    </>
  );
};

export default ControlPanel;
