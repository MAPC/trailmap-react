import React from "react";
import TransportationMarkersComponent from "./TransportationMarkersComponent";

/**
 * Renders Blue Bike stations layers
 */
const BlueBikeStationsLayers = ({
  showBlueBikeStations,
  showMunicipalityProfileMap,
  blueBikeStationsData,
  showStationLabels = false,
  hoveredBlueBikeStation,
}) => {
  if (!showBlueBikeStations || !showMunicipalityProfileMap || !blueBikeStationsData) {
    return null;
  }

  return (
    <TransportationMarkersComponent
      id="blue-bike-stations"
      data={blueBikeStationsData}
      color="#87CEEB"
      idProperty="Name"
      labelProperty="Name"
      showLabels={showStationLabels}
      hoveredFeature={hoveredBlueBikeStation}
    />
  );
};

export default BlueBikeStationsLayers;
