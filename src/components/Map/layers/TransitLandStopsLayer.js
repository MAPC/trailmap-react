import React from "react";
import { Source, Layer } from "react-map-gl";

// Direct call to Transit.land API
// API key will be sent via header using transformRequest in ReactMapGL
const TRANSIT_LAND_TILES_URL = 'https://transit.land/api/v2/tiles/stops/tiles/{z}/{x}/{y}.pbf';

/**
 * Renders Transit.land stops layer as vector tiles
 */
const TransitLandStopsLayer = ({ 
  showTransitLandStops, 
  showMunicipalityProfileMap,
  hoveredTransitStop
}) => {
  if (!showTransitLandStops || !showMunicipalityProfileMap) {
    return null;
  }

  return (
    <Source
      id="transit-land-stops-source"
      type="vector"
      tiles={[TRANSIT_LAND_TILES_URL]}
      minzoom={0}
      maxzoom={22}
    >
      {/* Transit stops - circle markers */}
      <Layer
        id="transit-land-stops"
        type="circle"
        source-layer="stops"
        interactive={true}
        paint={{
          "circle-radius": 4,
          "circle-color": "#FF6B35",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#FFFFFF",
          "circle-opacity": 0.8
        }}
      />
      
      {/* Hover effect for transit stops */}
      {hoveredTransitStop && (
        <Layer
          id="transit-land-stops-hover"
          type="circle"
          source-layer="stops"
          paint={{
            "circle-radius": 6,
            "circle-color": "#FF6B35",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FFFFFF",
            "circle-opacity": 0.9
          }}
          filter={
            hoveredTransitStop.properties?.onestop_id
              ? ["==", ["get", "onestop_id"], hoveredTransitStop.properties.onestop_id]
              : ["==", ["get", "onestop_id"], ""]
          }
        />
      )}
    </Source>
  );
};

export default TransitLandStopsLayer;

