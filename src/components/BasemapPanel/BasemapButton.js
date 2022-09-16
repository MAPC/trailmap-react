import React, { useContext } from "react";
import { LayerContext } from "../../App";

const BasemapButton = ({ layer }) => {
  const { baseLayer, setBaseLayer } = useContext(LayerContext);
  const isSelected = baseLayer.id === layer.id;

  return (
    <li
      className={isSelected ?
        "BasemapPanel_list__item mt-1 mb-1 p-1 text-center text-decoration-none BasemapPanel_list__item_selected" :
        "BasemapPanel_list__item mt-1 mb-1 p-1 text-center text-decoration-none"}
      onClick={() => setBaseLayer(layer)}>
      {layer.label}
    </li>
  );
};

export default BasemapButton; 