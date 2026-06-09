import React from "react";
import BoundariesPanelButton from "./BoundariesPanelButton";

const BOUNDARY_IDS = ["municipalities", "house", "senate"];

const BoundariesPanel = ({ onLayerToggle }) => {
  return (
    <div className="BoundariesPanel">
      <ul className="BoundariesPanel_list">
        {BOUNDARY_IDS.map((id) => (
          <BoundariesPanelButton key={id} boundaryId={id} onLayerToggle={onLayerToggle} />
        ))}
      </ul>
    </div>
  );
};

export default BoundariesPanel;
