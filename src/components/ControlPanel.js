import 'mapbox-gl/dist/mapbox-gl.css';
import React from 'react';
import TypeButton from './TypeButton';

const ControlPanel = ({ layerData, proposedData, showPanel, handleTrailLayers, handleProposedLayers, trailLayers, proposedLayers }) => {

  const renderTypeButton = layerData.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      trailLayers={trailLayers}
      handleTrailLayers={handleTrailLayers} />;
  });

  const renderProposedTypeButton = proposedData.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      trailLayers={proposedLayers}
      handleTrailLayers={handleProposedLayers} />;
  });

  return (
    <>
      {showPanel &&
        <div className="ControlPanel" >
          <>
            <div>
              <h2>Find the trails that work for you!</h2>
              <p>Select from various trail types to find trails best suited to your needs.</p>
            </div>
            <div>
              <h2>Existing:</h2>
              {renderTypeButton}
            </div>
            <div>
              <h2>Proposed:</h2>
              {renderProposedTypeButton}
            </div>
          </>
        </div >
      }
    </>
  );
};

export default ControlPanel;
