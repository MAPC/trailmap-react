import React from 'react';

const TypeButton = ({ layer, handleTrailLayers, trailLayers }) => {
  const toggleLayer = (layer) => handleTrailLayers(layer);
  const isSelected = trailLayers.includes(layer.id);

  return (
    <button
      className={isSelected ? `ControlPanel_type_button ControlPanel_type_button__${layer.id}__selected` : `ControlPanel_type_button ControlPanel_type_button__${layer.id}`}
      onClick={() => toggleLayer(layer.id)}
    >
      {layer.label}
    </button >
  );
};

export default TypeButton;