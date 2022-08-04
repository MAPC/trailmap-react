import React, { useContext } from "react";
import { LayerContext } from "../Map";

const BasemapButton = ({ layer }) => {
  const { baseLayer, setBaseLayer } = useContext(LayerContext);
  const isSelected = baseLayer.id === layer.id;

  return (
    <li
      className={isSelected ?
        "BasemapPanel_list__item BasemapPanel_list__item_selected" :
        "BasemapPanel_list__item"}
      onClick={() => setBaseLayer(layer)}>
      {layer.label}
    </li>
  )
}

export default BasemapButton; 