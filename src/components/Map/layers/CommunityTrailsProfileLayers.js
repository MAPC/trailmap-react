import React from "react";
import { Source, Layer } from "react-map-gl";
import { trailsProfileLayers } from "../constants/mapConstants";


/**
 * Renders GeoJSON trail layers for community trails profile (municipality profile)
 */
const CommunityTrailsProfileLayers = ({ 
  showMunicipalityProfileMap, 
  intersectedTrails, 
  hoveredTrail, 
  highlightedTrail,
  visibleTrailTypes = {} // Default to empty object (all visible)
}) => {
  const profileLayers = [];
  
  if (!showMunicipalityProfileMap || intersectedTrails.length === 0) {
    return profileLayers;
  }

  // Group trails by layer for efficient rendering
  const trailsByLayer = {};
  intersectedTrails.forEach(trail => {
    if (!trailsByLayer[trail.layerId]) {
      trailsByLayer[trail.layerId] = [];
    }
    trailsByLayer[trail.layerId].push(trail);
  });

  // Create a GeoJSON source for each layer
  Object.keys(trailsByLayer).forEach(layerId => {
    const layerTrails = trailsByLayer[layerId];
    const layerInfo = trailsProfileLayers.find(l => l.id === parseInt(layerId));
    
    // Check if this trail type is visible (default to true if not specified)
    const isVisible = visibleTrailTypes[layerId] !== false;
    
    if (layerInfo && isVisible) {
      // Create GeoJSON feature collection
      const geojsonData = {
        type: "FeatureCollection",
        features: layerTrails.map(trail => trail.feature)
      };

      // Build paint properties for base layer
      const paintProps = {
        "line-color": layerInfo.color,
        "line-width": 3,
        "line-opacity": 0.8
      };

      // Build paint properties for hover layer (thicker)
      const hoverPaintProps = {
        "line-color": layerInfo.color,
        "line-width": 6,
        "line-opacity": 1
      };

      // Build layout properties (for dashed lines)
      const layoutProps = {};
      if (layerInfo.dashArray) {
        paintProps["line-dasharray"] = layerInfo.dashArray;
        hoverPaintProps["line-dasharray"] = layerInfo.dashArray;
      }

      profileLayers.push(
        <Source key={`geojson-source-${layerId}`} id={`geojson-source-${layerId}`} type="geojson" data={geojsonData}>
          {/* Base layer */}
          <Layer
            id={`geojson-trail-${layerId}`}
            type="line"
            paint={paintProps}
            layout={layoutProps}
          />
          {/* Hover layer - only shows when hovering */}
          <Layer
            id={`geojson-trail-hover-${layerId}`}
            type="line"
            paint={hoverPaintProps}
            layout={layoutProps}
            filter={
              hoveredTrail && hoveredTrail.layerId === parseInt(layerId)
                ? ["==", ["get", "objectid"], hoveredTrail.attributes?.objectid || hoveredTrail.attributes?.OBJECTID || -1]
                : ["==", ["get", "objectid"], -1]
            }
          />
        </Source>
      );
    }
  });

  // Add highlight layer for selected trail from list
  if (highlightedTrail && highlightedTrail.feature) {
    const highlightGeojson = {
      type: "FeatureCollection",
      features: [highlightedTrail.feature]
    };

    // Use the trail's own color for highlighting
    const highlightPaint = {
      "line-color": highlightedTrail.color || "#FF6B00",
      "line-width": 7,
      "line-opacity": 1
    };

    // Add dash array if the trail has one
    const layerInfo = trailsProfileLayers.find(l => l.id === highlightedTrail.layerId);
    if (layerInfo && layerInfo.dashArray) {
      highlightPaint["line-dasharray"] = layerInfo.dashArray;
    }

    profileLayers.push(
      <Source key="highlighted-trail-source" id="highlighted-trail-source" type="geojson" data={highlightGeojson}>
        <Layer
          id="highlighted-trail"
          type="line"
          paint={highlightPaint}
        />
      </Source>
    );
  }

  return profileLayers;
};

export default CommunityTrailsProfileLayers;

