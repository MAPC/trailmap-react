import React from "react";
import { Source, Layer } from "react-map-gl";
import * as turf from "@turf/turf";

/**
 * Renders buffer analysis layers (circle, preview, center marker)
 */
export const renderBufferCircle = (bufferCenter, bufferRadius) => {
  if (!bufferCenter || !bufferRadius) return null;

  const centerPoint = turf.point([bufferCenter.lng, bufferCenter.lat]);
  const bufferCircle = turf.circle(centerPoint, bufferRadius / 1000, { 
    units: 'kilometers',
    steps: 64 
  });

  return (
    <Source key="buffer-circle-source" id="buffer-circle-source" type="geojson" data={bufferCircle}>
      {/* Buffer fill */}
      <Layer
        key="buffer-fill"
        id="buffer-fill"
        type="fill"
        paint={{
          "fill-color": "#0080ff",
          "fill-opacity": 0.15
        }}
      />
      {/* Buffer outline */}
      <Layer
        key="buffer-outline"
        id="buffer-outline"
        type="line"
        paint={{
          "line-color": "#0080ff",
          "line-width": 2,
          "line-dasharray": [2, 2]
        }}
      />
    </Source>
  );
};

export const renderBufferPreview = (bufferPreviewCenter, isBufferActive, bufferRadius) => {
  if (!bufferPreviewCenter || !isBufferActive) {
    return null;
  }

  const centerPoint = turf.point([bufferPreviewCenter.lng, bufferPreviewCenter.lat]);
  const previewCircle = turf.circle(centerPoint, bufferRadius / 1000, { 
    units: 'kilometers',
    steps: 64 
  });

  return (
    <Source key="buffer-preview-source" id="buffer-preview-source" type="geojson" data={previewCircle}>
      {/* Preview fill */}
      <Layer
        key="buffer-preview-fill"
        id="buffer-preview-fill"
        type="fill"
        paint={{
          "fill-color": "#ff8000",
          "fill-opacity": 0.1
        }}
      />
      {/* Preview outline */}
      <Layer
        key="buffer-preview-outline"
        id="buffer-preview-outline"
        type="line"
        paint={{
          "line-color": "#ff8000",
          "line-width": 2,
          "line-dasharray": [1, 1]
        }}
      />
    </Source>
  );
};

export const renderBufferCenter = (bufferCenter) => {
  if (!bufferCenter) return null;

  const centerGeoJSON = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [bufferCenter.lng, bufferCenter.lat]
      }
    }]
  };

  return (
    <Source key="buffer-center-source" id="buffer-center-source" type="geojson" data={centerGeoJSON}>
      <Layer
        key="buffer-center"
        id="buffer-center"
        type="circle"
        paint={{
          "circle-radius": 8,
          "circle-color": "#0080ff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }}
      />
    </Source>
  );
};

