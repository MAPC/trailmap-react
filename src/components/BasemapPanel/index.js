import React, { useState } from "react";
import BasemapButton from "./BasemapButton";
import BasemapIcon from "../../assets/icons/basemap-icon.svg"

const BasemapPanel = ({ basemaps }) => {
  const [showPanel, togglePanel] = useState(false)

  const renderButtons = basemaps.map((layer, index) => {
    return <BasemapButton key={index} layer={layer} />
  })

  return (
    <>
      <button
        className="BasemapControl"
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