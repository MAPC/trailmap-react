import React from "react";
import { Source, Layer } from "react-map-gl";

/**
 * Renders Blue Bike stations layers
 */
const BlueBikeStationsLayers = ({ 
  showBlueBikeStations, 
  showMunicipalityProfileMap, 
  blueBikeStationsData,
  hoveredBlueBikeStation
}) => {
  if (!showBlueBikeStations || !showMunicipalityProfileMap || !blueBikeStationsData) {
    return null;
  }

  return (
    <Source key="blue-bike-stations-source" id="blue-bike-stations-source" type="geojson" data={blueBikeStationsData}>
      {/* Blue Bike Station border circle */}
      <Layer
        key="blue-bike-stations-border"
        id="blue-bike-stations-border"
        type="circle"
        paint={{
          "circle-radius": 4,
          "circle-color": "#FFFFFF",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#FFFFFF"
        }}
      />
      
      {/* Blue Bike Station inner circle */}
      <Layer
        key="blue-bike-stations"
        id="blue-bike-stations"
        type="circle"
        interactive={true}
        paint={{
          "circle-radius": 3,
          "circle-color": "#87CEEB",
          "circle-opacity": 0.9
        }}
      />
      
      {/* Blue Bike Station hover border - larger circle */}
      <Layer
        key="blue-bike-stations-hover-border"
        id="blue-bike-stations-hover-border"
        type="circle"
        paint={{
          "circle-radius": 6,
          "circle-color": "#FFFFFF",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#87CEEB"
        }}
        filter={
          hoveredBlueBikeStation
            ? ["==", ["get", "Name"], hoveredBlueBikeStation.properties?.Name || ""]
            : ["==", ["get", "Name"], ""]
        }
      />
      
      {/* Blue Bike Station hover inner - larger circle */}
      <Layer
        key="blue-bike-stations-hover"
        id="blue-bike-stations-hover"
        type="circle"
        paint={{
          "circle-radius": 5,
          "circle-color": "#87CEEB",
          "circle-opacity": 1
        }}
        filter={
          hoveredBlueBikeStation
            ? ["==", ["get", "Name"], hoveredBlueBikeStation.properties?.Name || ""]
            : ["==", ["get", "Name"], ""]
        }
      />
    </Source>
  );
};

export default BlueBikeStationsLayers;

