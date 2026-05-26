import React from "react";
import { Source, Layer } from "react-map-gl";

// Direct call to Transit.land API for routes
// API key will be sent via header using transformRequest in ReactMapGL
const TRANSIT_LAND_ROUTES_URL = 'https://transit.land/api/v2/tiles/routes/tiles/{z}/{x}/{y}.pbf';

/**
 * Renders Transit.land routes layer as vector tiles
 */
const TransitLandRoutesLayer = ({ 
  showTransitLandRoutes, 
  showMunicipalityProfileMap
}) => {
  if (!showTransitLandRoutes || !showMunicipalityProfileMap) {
    return null;
  }

  return (
    <Source
      id="transit-land-routes-source"
      type="vector"
      tiles={[TRANSIT_LAND_ROUTES_URL]}
      minzoom={0}
      maxzoom={22}
    >
      {/* Transit routes - lines */}
      <Layer
        id="transit-land-routes"
        type="line"
        source-layer="routes"
        interactive={true}
        paint={{
          "line-color": [
            "case",
            ["has", ["get", "route_color"]],
            ["concat", "#", ["get", "route_color"]],
            "#666666" // Default gray color if no route_color
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 0.5,
            10, 1,
            14, 2
          ],
          "line-opacity": 0.7
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
      />
    </Source>
  );
};

export default TransitLandRoutesLayer;
