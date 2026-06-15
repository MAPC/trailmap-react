import React from "react";
import TrailsOverviewPanel from "./TrailsOverviewPanel";

const ControlPanel = () => (
  <div className="ControlPanel ControlPanel--overview text-left pt-5 pb-5 ps-2 pe-2 position-absolute overflow-auto">
    <div className="ControlPanel_opacity position-fixed" />
    <TrailsOverviewPanel />
  </div>
);

export default ControlPanel;
