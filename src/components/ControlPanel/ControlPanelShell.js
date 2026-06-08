import React from "react";
import ControlPanel from "./index";

const ControlPanelShell = ({
  showControlPanel,
  toggleControlPanel,
  ...controlPanelProps
}) => {
  return (
    <>
      {showControlPanel && <ControlPanel {...controlPanelProps} />}
      <button
        type="button"
        className={`ControlPanelToggle${
          showControlPanel ? " ControlPanelToggle--open" : " ControlPanelToggle--closed"
        }`}
        onClick={() => toggleControlPanel(!showControlPanel)}
        aria-label={showControlPanel ? "Collapse trail filters panel" : "Expand trail filters panel"}
        aria-expanded={showControlPanel}
      >
        <i className={`bi bi-chevron-${showControlPanel ? "left" : "right"}`} aria-hidden="true" />
      </button>
    </>
  );
};

export default ControlPanelShell;
