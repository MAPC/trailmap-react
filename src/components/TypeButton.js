import React from 'react';


const TypeButton = ({ layer, handleTrailLayers, trailLayers }) => {
  const toggleLayer = (layer) => handleTrailLayers(layer);
  const isSelected = trailLayers.includes(layer.id);

  return (
    <button
      className={isSelected ? `TypeButton TypeButton__${layer.id}__selected` : `TypeButton TypeButton__${layer.id}`}
      onClick={() => toggleLayer(layer.id)}
    >
      {layer.label}
    </button >
  );
};

export default TypeButton;