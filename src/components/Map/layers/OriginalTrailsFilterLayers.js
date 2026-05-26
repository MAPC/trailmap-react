import React from "react";
import { Layer } from "react-map-gl";

/**
 * Renders vector tile layers for original trails filters
 */
const OriginalTrailsFilterLayers = ({ trailLayers, proposedLayers, existingTrails, proposedTrails, hoveredTrailId }) => {
  const filterLayers = [];
  
  const allLayers = [...trailLayers, ...proposedLayers];
  allLayers.forEach((layer) => {
    const layerSet = layer.includes("Proposed") ? proposedTrails : existingTrails;
    const addLayer = layerSet.find((l) => l.id === layer);
    if (addLayer) {
      filterLayers.push(
        <React.Fragment key={addLayer.id}>
          <Layer
            esri_id={addLayer["esri-id"]}
            id={addLayer.id}
            type={addLayer.type}
            source="MAPC trail vector tiles"
            source-layer={addLayer["source-layer"]}
            paint={addLayer.paint}
            layout={addLayer.layout}
          />
          {/* Hover layer: thicker line when hovering */}
          <Layer
            id={`${addLayer.id}-hover`}
            type={addLayer.type}
            source="MAPC trail vector tiles"
            source-layer={addLayer["source-layer"]}
            paint={{
              ...addLayer.paint,
              "line-width": (addLayer.paint?.["line-width"] ?? 2) * 2
            }}
            layout={addLayer.layout}
            filter={
              hoveredTrailId != null
                ? [
                    "==",
                    ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
                    hoveredTrailId
                  ]
                : ["==", ["get", "OBJECTID"], -1]
            }
          />
        </React.Fragment>
      );
    }
  });

  return filterLayers;
};

export default OriginalTrailsFilterLayers;

