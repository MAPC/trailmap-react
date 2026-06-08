import React from "react";
import Form from "react-bootstrap/Form";

const TrailLayerRow = ({ label, color, dashed = false, checked, onChange, id }) => {
  return (
    <div className="TrailLayerRow">
      <span
        className={`TrailLayerRow__swatch${dashed ? " TrailLayerRow__swatch--dashed" : ""}`}
        style={{ "--swatch-color": color }}
        aria-hidden="true"
      />
      <span className="TrailLayerRow__label">{label}</span>
      <Form.Check
        type="switch"
        id={id}
        className="TrailLayerRow__switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
    </div>
  );
};

export default TrailLayerRow;
