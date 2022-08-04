import React from "react";
import BasemapButton from "./BasemapButton";

const BasemapPanel = ({ basemaps, showPanel }) => {

  const renderButtons = basemaps.map((layer, index) => {
    return <BasemapButton key={index} layer={layer} />
  });

  return (<>
    {showPanel &&
      <div className="BasemapPanel">
        <ul className="BasemapPanel_list">
          {renderButtons}
        </ul>
      </div>
    }
  </>
  );
};

export default BasemapPanel; 