import React from "react";
import { Source, Layer } from "react-map-gl";

// MBTA official line colors
const lineColors = {
  'RED': '#DA020E',
  'ORANGE': '#ED8B00', 
  'GREEN': '#00843D',
  'BLUE': '#003DA5'
};

/**
 * Renders subway lines and stations layers
 */
const SubwayStationsLayers = ({ 
  showSubwayStations, 
  showMunicipalityProfileMap, 
  subwayStationsData,
  hoveredSubwayStation
}) => {
  if (!showSubwayStations || !showMunicipalityProfileMap || !subwayStationsData) {
    return null;
  }

  return (
    <>
      {/* Subway Lines */}
      <Source key="subway-lines-source" id="subway-lines-source" type="geojson" data={subwayStationsData.lines}>
        {/* Subway Line background - thinner line */}
        <Layer
          key="subway-lines-background"
          id="subway-lines-background"
          type="line"
          paint={{
            "line-color": "#FFFFFF",
            "line-width": 3,
            "line-opacity": 0.8
          }}
        />
        
        {/* Subway Line foreground - colored line */}
        <Layer
          key="subway-lines"
          id="subway-lines"
          type="line"
          paint={{
            "line-color": [
              "match",
              ["get", "LINE"],
              "RED", lineColors.RED,
              "ORANGE", lineColors.ORANGE,
              "GREEN", lineColors.GREEN,
              "BLUE", lineColors.BLUE,
              "#666666" // default color
            ],
            "line-width": 2,
            "line-opacity": 0.9
          }}
        />
      </Source>

      {/* Subway Stations */}
      <Source key="subway-stations-source" id="subway-stations-source" type="geojson" data={subwayStationsData.stations}>
        {/* Subway Station border circle */}
        <Layer
          key="subway-stations-border"
          id="subway-stations-border"
          type="circle"
          paint={{
            "circle-radius": 4,
            "circle-color": "#FFFFFF",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#FFFFFF"
          }}
        />
        
        {/* Subway Station inner circle with line color */}
        <Layer
          key="subway-stations"
          id="subway-stations"
          type="circle"
          interactive={true}
          paint={{
            "circle-radius": 3,
            "circle-color": [
              "match",
              ["get", "LINE"],
              "RED", lineColors.RED,
              "ORANGE", lineColors.ORANGE,
              "GREEN", lineColors.GREEN,
              "BLUE", lineColors.BLUE,
              "#666666" // default color
            ],
            "circle-opacity": 0.9
          }}
        />
        
        {/* Subway Station hover border - larger circle */}
        <Layer
          key="subway-stations-hover-border"
          id="subway-stations-hover-border"
          type="circle"
          paint={{
            "circle-radius": 6,
            "circle-color": "#FFFFFF",
            "circle-stroke-width": 2,
            "circle-stroke-color": [
              "match",
              ["get", "LINE"],
              "RED", lineColors.RED,
              "ORANGE", lineColors.ORANGE,
              "GREEN", lineColors.GREEN,
              "BLUE", lineColors.BLUE,
              "#666666" // default color
            ]
          }}
          filter={
            hoveredSubwayStation
              ? ["==", ["get", "STATION"], hoveredSubwayStation.properties?.STATION || ""]
              : ["==", ["get", "STATION"], ""]
          }
        />
        
        {/* Subway Station hover inner - larger circle */}
        <Layer
          key="subway-stations-hover"
          id="subway-stations-hover"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": [
              "match",
              ["get", "LINE"],
              "RED", lineColors.RED,
              "ORANGE", lineColors.ORANGE,
              "GREEN", lineColors.GREEN,
              "BLUE", lineColors.BLUE,
              "#666666" // default color
            ],
            "circle-opacity": 0.9
          }}
          filter={
            hoveredSubwayStation
              ? ["==", ["get", "STATION"], hoveredSubwayStation.properties?.STATION || ""]
              : ["==", ["get", "STATION"], ""]
          }
        />
      </Source>
    </>
  );
};

export default SubwayStationsLayers;

