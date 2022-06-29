import React from 'react';


const TypeButton = ({layer, handleTrailLayers}) => {
  const toggleLayer = (layer) => handleTrailLayers(layer);

  return(
    <button
      className={'TypeButton ' + 'TypeButton__' + layer.id}
      onClick={() => toggleLayer(layer.id)}
    >
      {layer.label}
    </button>
  );
};

export default TypeButton;