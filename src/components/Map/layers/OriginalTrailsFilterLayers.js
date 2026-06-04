import React from "react";
import { Layer } from "react-map-gl";

/**
 * Renders vector tile layers for original trails filters
 */
const OriginalTrailsFilterLayers = ({
  trailLayers = [],
  proposedLayers = [],
  existingTrails = [],
  proposedTrails = [],
}) => {
  const filterLayers = [];
  
  const allLayers = [...trailLayers, ...proposedLayers];
  allLayers.forEach((layer) => {
    const layerSet = layer.includes("Proposed") ? proposedTrails : existingTrails;
    const addLayer = layerSet.find((l) => l.id === layer);
    if (addLayer) {
      filterLayers.push(
        <Layer
          key={addLayer.id}
          esri_id={addLayer["esri-id"]}
          id={addLayer.id}
          type={addLayer.type}
          source="MAPC trail vector tiles"
          source-layer={addLayer["source-layer"]}
          paint={addLayer.paint}
          layout={addLayer.layout}
        />
      );
    }
  });

  return filterLayers;
};

export default OriginalTrailsFilterLayers;

