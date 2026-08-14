import React from "react";
import TransportationMarkersComponent from "./TransportationMarkersComponent";

// Direct call to Transit.land API
// API key will be sent via header using transformRequest in ReactMapGL
const TRANSIT_LAND_TILES_URL =
  "https://transit.land/api/v2/tiles/stops/tiles/{z}/{x}/{y}.pbf";

/**
 * Renders Transit.land stops layer as vector tiles (no labels).
 */
const TransitLandStopsLayer = ({
  showTransitLandStops,
  showMunicipalityProfileMap,
  hoveredTransitStop,
}) => {
  if (!showTransitLandStops || !showMunicipalityProfileMap) {
    return null;
  }

  return (
    <TransportationMarkersComponent
      id="transit-land-stops"
      tiles={[TRANSIT_LAND_TILES_URL]}
      sourceLayer="stops"
      minzoom={0}
      maxzoom={22}
      color="#FF6B35"
      idProperty="onestop_id"
      hoveredFeature={hoveredTransitStop}
    />
  );
};

export default TransitLandStopsLayer;
