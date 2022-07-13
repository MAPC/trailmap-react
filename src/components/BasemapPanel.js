import React, { useState } from "react";
import BasemapButton from "./BasemapButton";
import BasemapIcon from "../assets/basemap-icon.svg"

const BasemapPanel = ({ basemaps, handleBaseLayer, baseLayer }) => {

  const [showPanel, togglePanel] = useState(false)

  const renderButtons = basemaps.map((layer, index) => {
    return <BasemapButton key={index} layer={layer} handleBaseLayer={handleBaseLayer} baseLayer={baseLayer} />
  })

  return (
    <>
      <button className="BasemapControl"
        onClick={() => togglePanel(!showPanel)}
      >
        <img src={BasemapIcon} alt="Select Basemap" />
      </button>
      <div className="BasemapPanel">
        {showPanel &&
          <ul className="BasemapPanel_list">
            {renderButtons}
          </ul>
        }
      </div>
    </>
  )
}

export default BasemapPanel; 