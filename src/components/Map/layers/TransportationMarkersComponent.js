import React from "react";
import { Source, Layer } from "react-map-gl";

const labelLayout = {
  "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
  "text-size": 11,
  "text-offset": [0, 1.5],
  "text-anchor": "top",
  "text-optional": true,
  "text-allow-overlap": false,
};

const labelPaint = {
  "text-color": "#333333",
  "text-halo-color": "#FFFFFF",
  "text-halo-width": 1.5,
};

/**
 * Shared transportation markers component for stations/stops
 * (commuter rail, Blue Bike, T-stops, transit stops).
 * Renders circle markers with optional name labels and hover highlight.
 */
const TransportationMarkersComponent = ({
  id,
  data = null,
  tiles = null,
  sourceLayer = null,
  minzoom,
  maxzoom,
  color,
  borderStrokeColor = "#FFFFFF",
  idProperty,
  labelProperty = null,
  showLabels = false,
  hoveredFeature = null,
  interactive = true,
}) => {
  if (!data && !tiles?.length) return null;

  const hoverFilter = [
    "==",
    ["get", idProperty],
    hoveredFeature?.properties?.[idProperty] ?? "",
  ];
  const layerSourceProps = sourceLayer ? { "source-layer": sourceLayer } : {};
  const sourceProps = tiles?.length
    ? { type: "vector", tiles, minzoom, maxzoom }
    : { type: "geojson", data };

  return (
    <Source id={`${id}-source`} {...sourceProps}>
      <Layer
        id={`${id}-border`}
        type="circle"
        {...layerSourceProps}
        paint={{
          "circle-radius": 4,
          "circle-color": "#FFFFFF",
          "circle-stroke-width": 1,
          "circle-stroke-color": borderStrokeColor,
        }}
      />

      <Layer
        id={id}
        type="circle"
        interactive={interactive}
        {...layerSourceProps}
        paint={{
          "circle-radius": 3,
          "circle-color": color,
          "circle-opacity": 0.9,
        }}
      />

      {showLabels && labelProperty && (
        <Layer
          id={`${id}-labels`}
          type="symbol"
          {...layerSourceProps}
          layout={{
            ...labelLayout,
            "text-field": ["get", labelProperty],
          }}
          paint={labelPaint}
        />
      )}

      <Layer
        id={`${id}-hover-border`}
        type="circle"
        {...layerSourceProps}
        paint={{
          "circle-radius": 6,
          "circle-color": "#FFFFFF",
          "circle-stroke-width": 2,
          "circle-stroke-color": color,
        }}
        filter={hoverFilter}
      />

      <Layer
        id={`${id}-hover`}
        type="circle"
        {...layerSourceProps}
        paint={{
          "circle-radius": 5,
          "circle-color": color,
          "circle-opacity": 1,
        }}
        filter={hoverFilter}
      />
    </Source>
  );
};

export default TransportationMarkersComponent;
