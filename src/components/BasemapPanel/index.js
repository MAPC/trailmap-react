import React, { useContext } from "react";
import BasemapButton from "./BasemapButton";
import { LayerContext } from "../../App";

const BasemapPanel = () => {
  const { basemaps } = useContext(LayerContext);

  const renderButtons = basemaps.map((layer, index) => {
    return <BasemapButton key={index} layer={layer} />;
  });

  return (
    <div className="BasemapPanel position-absolute">
      <ul className="BasemapPanel_list text-center">
        {renderButtons}
      </ul>
    </div>
  );
};

export default BasemapPanel; 