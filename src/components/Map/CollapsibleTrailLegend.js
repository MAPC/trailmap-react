import React, { useState } from "react";
import Collapse from "react-bootstrap/Collapse";

const CollapsibleTrailLegend = ({
  label = "Trail types",
  defaultOpen = true,
  controlPanelOpen = false,
  className = "",
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`MapTrailLegend${open ? " MapTrailLegend--open" : ""}${
        controlPanelOpen ? " MapTrailLegend--panelOpen" : ""
      }${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        className="MapTrailLegend__toggle"
        aria-expanded={open}
        aria-controls="map-trail-legend-panel"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span>{label}</span>
        <i
          className={`fas fa-chevron-${open ? "up" : "down"}`}
          aria-hidden="true"
        />
      </button>
      <Collapse in={open}>
        <div id="map-trail-legend-panel" className="MapTrailLegend__collapse">
          <div className="MapTrailLegend__panel">{children}</div>
        </div>
      </Collapse>
    </div>
  );
};

export default CollapsibleTrailLegend;
