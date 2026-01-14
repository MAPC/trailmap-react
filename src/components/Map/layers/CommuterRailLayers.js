import React from "react";
import { Source, Layer } from "react-map-gl";

/**
 * Renders commuter rail lines and stations layers
 */
const CommuterRailLayers = ({ 
  showCommuterRail, 
  showMunicipalityProfileMap, 
  commuterRailData, 
  commuterRailStationsData,
  showStationLabels,
  hoveredCommuterRailStation
}) => {
  if (!showCommuterRail || !showMunicipalityProfileMap || !commuterRailData) {
    return null;
  }

  return (
    <>
      {/* Commuter Rail Lines */}
      <Source key="commuter-rail-source" id="commuter-rail-source" type="geojson" data={commuterRailData}>
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
                "line-opacity": 0.8
              }}
              filter={["==", ["get", "shape_id"], feature.properties.shape_id]}
            />
          );
        })}
      </Source>
      
      {/* Commuter Rail Stations */}
      {commuterRailStationsData && (
        <Source key="commuter-rail-stations-source" id="commuter-rail-stations-source" type="geojson" data={commuterRailStationsData}>
          {/* Station outer circle (border) */}
          <Layer
            key="commuter-rail-stations-border"
            id="commuter-rail-stations-border"
            type="circle"
            paint={{
              "circle-radius": 4,
              "circle-color": "#FFFFFF",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#333333"
            }}
          />
          
          {/* Station inner circle (fill) */}
          <Layer
            key="commuter-rail-stations"
            id="commuter-rail-stations"
            type="circle"
            paint={{
              "circle-radius": 3,
              "circle-color": "#FF6B35",
              "circle-opacity": 0.9
            }}
          />
          
          {/* Station labels - only show when enabled */}
          {showStationLabels && (
            <Layer
              key="commuter-rail-stations-labels"
              id="commuter-rail-stations-labels"
              type="symbol"
              layout={{
                "text-field": ["get", "station"],
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-size": 11,
                "text-offset": [0, 1.5],
                "text-anchor": "top"
              }}
              paint={{
                "text-color": "#333333",
                "text-halo-color": "#FFFFFF",
                "text-halo-width": 1.5
              }}
            />
          )}
          
          {/* Commuter Rail Station hover border - larger circle */}
          <Layer
            key="commuter-rail-stations-hover-border"
            id="commuter-rail-stations-hover-border"
            type="circle"
            paint={{
              "circle-radius": 6,
              "circle-color": "#FFFFFF",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FF6B35"
            }}
            filter={
              hoveredCommuterRailStation
                ? ["==", ["get", "station"], hoveredCommuterRailStation.properties?.station || ""]
                : ["==", ["get", "station"], ""]
            }
          />
          
          {/* Commuter Rail Station hover inner - larger circle */}
          <Layer
            key="commuter-rail-stations-hover"
            id="commuter-rail-stations-hover"
            type="circle"
            paint={{
              "circle-radius": 5,
              "circle-color": "#FF6B35",
              "circle-opacity": 1
            }}
            filter={
              hoveredCommuterRailStation
                ? ["==", ["get", "station"], hoveredCommuterRailStation.properties?.station || ""]
                : ["==", ["get", "station"], ""]
            }
          />
        </Source>
      )}
    </>
  );
};

export default CommuterRailLayers;

