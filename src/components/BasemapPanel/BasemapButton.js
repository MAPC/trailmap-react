import React from "react";

const BasemapButton = ({ layer, handleBaseLayer, baseLayer }) => {
  const isSelected = baseLayer.id === layer.id;

  return (
    <li className={isSelected ? "BasemapPanel_list__item BasemapPanel_list__item_selected" : "BasemapPanel_list__item"} onClick={() => handleBaseLayer(layer)}>
      {layer.label}
    </li>
  )
}

export default BasemapButton; 