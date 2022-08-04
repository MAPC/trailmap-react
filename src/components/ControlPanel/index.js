import React, { useContext } from "react";
import TypeButton from "./TypeButton";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";

const ControlPanel = () => {
  const { showGlossaryModal, toggleGlossaryModal } = useContext(ModalContext);
  const { existingTrails, proposedTrails } = useContext(LayerContext);

  const renderTypeButton = existingTrails.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      type="trail" />;
  });

  const renderProposedTypeButton = proposedTrails.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      type="proposed" />;
  });

  return (
    <div className="ControlPanel" >
      <div className="ControlPanel_opacity"></div>
      <div>
        <span className="ControlPanel__title">Find the trails that work for you!</span>
        <p>Select from various trail types to find trails best suited to your needs. Find a description of each to the trail types
          <span className="ControlPanel__glossary" onClick={() => { toggleGlossaryModal(!showGlossaryModal) }}>here</span>.</p>
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
  );
};

export default ControlPanel;
