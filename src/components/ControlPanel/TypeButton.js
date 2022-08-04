import React, { useContext } from 'react';
import { LayerContext } from '../../App';

const TypeButton = ({ layer, type }) => {
  const { trailLayers, setTrailLayers, proposedLayers, setProposedLayers, } = useContext(LayerContext);

  const toggleLayer = (layer, type) => {
    if (type == 'trail') {
      trailLayers.includes(layer) ?
        setTrailLayers(current => current.filter(trailLayer => trailLayer !== layer)) :
        setTrailLayers(current => [...current, layer]);
    } else {
      proposedLayers.includes(layer) ?
        setProposedLayers(current => current.filter(proposedLayers => proposedLayers !== layer)) :
        setProposedLayers(current => [...current, layer]);
    }
  };
  const isSelected = type == 'trail' ? trailLayers.includes(layer.id) : proposedLayers.includes(layer.id);

  return (
    <button
      className={isSelected ?
        `ControlPanel_type_button ControlPanel_type_button__${layer.id}__selected` :
        `ControlPanel_type_button ControlPanel_type_button__${layer.id}`}
      onClick={() => toggleLayer(layer.id, type)}
    >
      {layer.label}
    </button >
  );
};

export default TypeButton;