import React from "react";

const BasemapButton = ({ layer, handleBaseLayer }) => {

  return (
    <li onClick={() => handleBaseLayer(layer)}>
      {layer.label}
    </li>
  )
}

export default BasemapButton; 