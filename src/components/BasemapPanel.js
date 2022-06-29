import React, { useState } from "react";
import BasemapButton from "./BasemapButton";
import BasemapIcon from "../assets/basemap-icon.svg"

const BasemapPanel = ({ basemaps, handleBaseLayer }) => {

  const [showPanel, togglePanel] = useState(false)

  const renderButtons = basemaps.map((layer, index) => {
    return <BasemapButton key={index} layer={layer} handleBaseLayer={handleBaseLayer} />
  })

  return (
    <div className="BasemapPanel">
      <button
        onClick={() => togglePanel(!showPanel)}
      >
        <img src={BasemapIcon} alt="Select Basemap" />
      </button>
      <div className="BasemapPanel__layer-list">
        {showPanel &&
          <ul>
            {renderButtons}
          </ul>
        }
      </div>
    </div>
  )
}

export default BasemapPanel; 