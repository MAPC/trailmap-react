import React, { useContext } from "react";
import Form from "react-bootstrap/Form";
import TypeButton from "./TypeButton";
import Legend from "./Legend";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";

const ControlPanel = () => {
  const { showGlossaryModal, toggleGlossaryModal } = useContext(ModalContext);
  const { existingTrails, proposedTrails, showLandlineLayer, toggleLandlineLayer } = useContext(LayerContext);

  const renderTypeButton = existingTrails.map((layer, index) => {
    return <TypeButton key={index} layer={layer} type="trail" />;
  });

  const renderProposedTypeButton = proposedTrails.map((layer, index) => {
    return <TypeButton key={index} layer={layer} type="proposed" />;
  });

  return (
    <div className="ControlPanel text-left pt-5 pb-5 ps-2 pe-2 position-absolute overflow-auto">
      <div className="ControlPanel_opacity position-fixed"></div>
      <div>
        <span className="ControlPanel__title lh-base d-block mt-2 mb-2">Find the trails that work for you!</span>
        <p>
          Select from various trail types to find trails best suited to your needs. Find a description of each to the
          trail types{" "}
          <span
            className="ControlPanel__glossary"
            onClick={() => {
              toggleGlossaryModal(!showGlossaryModal);
            }}
          >
            here
          </span>
          .
        </p>
        <p>Click an existing or proposed trail on the map for more information.</p>
      </div>
      <div>
        <span className="ControlPanel__subtitle mt-2 mb-2 d-block fw-bold">Existing:</span>
        <div className="ButtonGroup">
         {renderTypeButton}
        </div>
        
      </div>
      <div>
        <span className="ControlPanel__subtitle mt-2 mb-2 d-block fw-bold">Planned:</span>
        <div className="ButtonGroup">
        {renderProposedTypeButton}
        </div>
       
      </div>
      <div>
        <span className="ControlPanel__subtitle mt-2 mb-2 d-block fw-bold">Regional Greenway Network:</span>
        <Form.Check
          type="checkbox"
          id="default-checkbox"
          className="ControlPanel_checkbox mb-5 d-flex align-items-center"
          checked={showLandlineLayer}
          onChange={() => toggleLandlineLayer(!showLandlineLayer)}
          label="Show LandLine greenway layer"
        />
        <Legend />
      </div>
    </div>
  );
};

export default ControlPanel;
