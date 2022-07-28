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
          <div class="ControlPanel_opacity"></div>
          <div>
            <span class="ControlPanel__title">Find the trails that work for you!</span>
            <p>Select from various trail types to find trails best suited to your needs.</p>
          </div>
          <div>
            <span class="ControlPanel__subtitle">Existing:</span>
            {renderTypeButton}
          </div>
          <div>
            <span class="ControlPanel__subtitle">Proposed:</span>
            {renderProposedTypeButton}
          </div>
        </div>
      }
    </>
  );
};

export default ControlPanel;
