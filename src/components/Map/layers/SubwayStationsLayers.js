import React from "react";
import { Source, Layer } from "react-map-gl";
import TransportationMarkersComponent from "./TransportationMarkersComponent";

// MBTA official line colors
const lineColors = {
  RED: "#DA020E",
  ORANGE: "#ED8B00",
  GREEN: "#00843D",
  BLUE: "#003DA5",
};

const subwayStationColor = [
  "match",
  ["get", "LINE"],
  "RED",
  lineColors.RED,
  "ORANGE",
  lineColors.ORANGE,
  "GREEN",
  lineColors.GREEN,
  "BLUE",
  lineColors.BLUE,
  "#666666",
];

/**
 * Renders subway lines and stations layers
 */
const SubwayStationsLayers = ({
  showSubwayStations,
  showMunicipalityProfileMap,
  subwayStationsData,
  showStationLabels = false,
  hoveredSubwayStation,
}) => {
  if (!showSubwayStations || !showMunicipalityProfileMap || !subwayStationsData) {
    return null;
  }

  return (
    <>
      <Source
        key="subway-lines-source"
        id="subway-lines-source"
        type="geojson"
        data={subwayStationsData.lines}
      >
        <Layer
          key="subway-lines-background"
          id="subway-lines-background"
          type="line"
          paint={{
            "line-color": "#FFFFFF",
            "line-width": 3,
            "line-opacity": 0.8,
          }}
        />

        <Layer
          key="subway-lines"
          id="subway-lines"
          type="line"
          paint={{
            "line-color": subwayStationColor,
            "line-width": 2,
            "line-opacity": 0.9,
          }}
        />
      </Source>

      <TransportationMarkersComponent
        id="subway-stations"
        data={subwayStationsData.stations}
        color={subwayStationColor}
        idProperty="STATION"
        labelProperty="STATION"
        showLabels={showStationLabels}
        hoveredFeature={hoveredSubwayStation}
      />
    </>
  );
};

export default SubwayStationsLayers;
