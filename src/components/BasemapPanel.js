import React, { useState } from "react";
import BasemapButton from "./BasemapButton";

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
        Show all basemaps
      </button>
      {showPanel &&
        <ul>
          {renderButtons}
        </ul>
      }
    </div>
  )
}

export default BasemapPanel; 