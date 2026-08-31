import React from "react";
import { Source, Layer } from "react-map-gl";
import TransportationMarkersComponent from "./TransportationMarkersComponent";

/**
 * Renders commuter rail lines and stations layers
 */
const CommuterRailLayers = ({
  showCommuterRail,
  showMunicipalityProfileMap,
  commuterRailData,
  commuterRailStationsData,
  showStationLabels = false,
  hoveredCommuterRailStation,
}) => {
  if (!showCommuterRail || !showMunicipalityProfileMap || !commuterRailData) {
    return null;
  }

  return (
    <>
      <Source
        key="commuter-rail-source"
        id="commuter-rail-source"
        type="geojson"
        data={commuterRailData}
      >
        {commuterRailData.features.map((feature) => {
          const routeColor = feature.properties?.route_color
            ? `#${feature.properties.route_color}`
            : "#808080";

          return (
            <Layer
              key={`commuter-rail-${feature.id}`}
              id={`commuter-rail-${feature.id}`}
              type="line"
              paint={{
                "line-color": routeColor,
                "line-width": 1,
                "line-opacity": 0.8,
              }}
              filter={["==", ["get", "shape_id"], feature.properties.shape_id]}
            />
          );
        })}
      </Source>

      {commuterRailStationsData && (
        <TransportationMarkersComponent
          id="commuter-rail-stations"
          data={commuterRailStationsData}
          color="#FF6B35"
          borderStrokeColor="#333333"
          idProperty="station"
          labelProperty="station"
          showLabels={showStationLabels}
          hoveredFeature={hoveredCommuterRailStation}
          interactive={false}
        />
      )}
    </>
  );
};

export default CommuterRailLayers;
