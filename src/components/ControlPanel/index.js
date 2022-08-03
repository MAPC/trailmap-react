import 'mapbox-gl/dist/mapbox-gl.css';
import React from 'react';
import TypeButton from './TypeButton';

const ControlPanel = ({ layerData, proposedData, showPanel, handleGlossaryModal }) => {

  const renderTypeButton = layerData.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      type="trail" />;
  });

  const renderProposedTypeButton = proposedData.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      type="proposed" />;
  });

  return (
    <>
      {showPanel &&
        <div className="ControlPanel" >
          <div className="ControlPanel_opacity"></div>
          <div>
            <span className="ControlPanel__title">Find the trails that work for you!</span>
            <p>Select from various trail types to find trails best suited to your needs. Find a description of each to the trail types <span className="ControlPanel__glossary" onClick={handleGlossaryModal}>here</span>.</p>
          </div>
          <div>
            <span className="ControlPanel__subtitle">Existing:</span>
            {renderTypeButton}
          </div>
          <div>
            <span className="ControlPanel__subtitle">Proposed:</span>
            {renderProposedTypeButton}
          </div>
        </div>
      }
    </>
  );
};

export default ControlPanel;
