import React from "react";

const ControlPanelShell = ({
  showControlPanel,
  toggleControlPanel,
  children,
}) => {
  return (
    <div
      className={`ControlPanelShell${
        showControlPanel ? " ControlPanelShell--open" : " ControlPanelShell--closed"
      }`}
    >
      <div
        className="ControlPanelShell__drawer"
        aria-hidden={!showControlPanel}
      >
        {children}
      </div>
      <button
        type="button"
        className="ControlPanelShell__toggle"
        onClick={() => toggleControlPanel(!showControlPanel)}
        aria-label={showControlPanel ? "Collapse trail filters panel" : "Expand trail filters panel"}
        aria-expanded={showControlPanel}
      >
        <i className={`bi bi-chevron-${showControlPanel ? "left" : "right"}`} aria-hidden="true" />
      </button>
    </div>
  );
};

export default ControlPanelShell;
