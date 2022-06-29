import React from "react";

function toggleLayer() {
  // reuseable logic to toggle between classes for displaying a given layer
}

const TypeButton = ({layer}) => {
  return(
    <button
      className={'control-panel__type-button ' + 'control-panel__type-button-' + layer.id}
      onClick={() => toggleLayer()}
    >
      {layer.label}
   </button>
  )
}

export default TypeButton;