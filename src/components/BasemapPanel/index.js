import React, { useContext } from "react";
import BasemapButton from "./BasemapButton";
import { LayerContext } from '../../App'

const BasemapPanel = () => {
  const { basemaps } = useContext(LayerContext);

  const renderButtons = basemaps.map((layer, index) => {
    return <BasemapButton key={index} layer={layer} />
  });

  return (
    <div className="BasemapPanel">
      <ul className="BasemapPanel_list">
        {renderButtons}
      </ul>
    </div>
  );
};

export default BasemapPanel; 