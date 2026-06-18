import React from "react";
import { Source, Layer } from "react-map-gl";
import { isSameTrailHighlight } from "../utils/trailHighlightUtils";

const toFeatureCollection = (highlight) => ({
  type: "FeatureCollection",
  features: highlight?.feature ? [highlight.feature] : [],
});

const isDashedHighlight = (highlight) => {
  const dash = highlight?.lineDasharray;
  return Array.isArray(dash) ? dash.length > 0 : Boolean(dash);
};

const getHighlightPaint = (highlight, mode) => {
  const dashed = isDashedHighlight(highlight);
  const lineWidth = mode === "hover" ? (dashed ? 3.5 : 6) : dashed ? 4.5 : 8;

  return {
    "line-color": highlight.lineColor,
    "line-width": lineWidth,
    "line-opacity": 1,
    ...(dashed ? { "line-dasharray": highlight.lineDasharray } : {}),
  };
};

const getHighlightLayout = (highlight) => ({
  "line-cap": isDashedHighlight(highlight) ? "butt" : "round",
  "line-join": "round",
});

const TrailsOverviewHighlightLayer = ({ hovered, clicked }) => {
  const showHover =
    hovered?.feature?.geometry &&
    (!clicked || !isSameTrailHighlight(hovered, clicked));

  if (!showHover && !(clicked?.feature?.geometry)) {
    return null;
  }

  return (
    <>
      {showHover && (
        <Source
          id="trails-overview-hover-highlight"
          type="geojson"
          data={toFeatureCollection(hovered)}
        >
          <Layer
            id="trails-overview-hover-highlight-layer"
            type="line"
            paint={getHighlightPaint(hovered, "hover")}
            layout={getHighlightLayout(hovered)}
          />
        </Source>
      )}

      {clicked?.feature?.geometry && (
        <Source
          id="trails-overview-click-highlight"
          type="geojson"
          data={toFeatureCollection(clicked)}
        >
          <Layer
            id="trails-overview-click-highlight-layer"
            type="line"
            paint={getHighlightPaint(clicked, "click")}
            layout={getHighlightLayout(clicked)}
          />
        </Source>
      )}
    </>
  );
};

export default TrailsOverviewHighlightLayer;
