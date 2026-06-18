import { esriPolylineToGeoJSON } from "./trailSegmentIdentify";

export const getActiveTrailLayerIds = (trailLayers = [], proposedLayers = []) => [
  ...trailLayers,
  ...proposedLayers,
];

export const getVisibleEsriLayerIds = (
  trailLayers = [],
  proposedLayers = [],
  existingTrails = [],
  proposedTrails = []
) => [
  ...existingTrails.filter((layer) => trailLayers.includes(layer.id)).map((layer) => layer["esri-id"]),
  ...proposedTrails.filter((layer) => proposedLayers.includes(layer.id)).map((layer) => layer["esri-id"]),
];

export const getTrailLayerConfig = (layerId, existingTrails = [], proposedTrails = []) =>
  existingTrails.find((layer) => layer.id === layerId) ||
  proposedTrails.find((layer) => layer.id === layerId);

export const getTrailFeatureId = (feature) => {
  const props = feature?.properties || {};
  const id = props.objectid ?? props.OBJECTID ?? props.ObjectID ?? null;
  if (id == null || id === "") return null;
  const numericId = Number(id);
  return Number.isNaN(numericId) ? id : numericId;
};

export const getTrailFeatureIdFromAttributes = (attributes = {}) => {
  const id = attributes.objectid ?? attributes.OBJECTID ?? attributes.ObjectID ?? null;
  if (id == null || id === "") return null;
  const numericId = Number(id);
  return Number.isNaN(numericId) ? id : numericId;
};

export const pickIdentifyResultForLayer = (
  results,
  mapLayerId,
  existingTrails,
  proposedTrails
) => {
  if (!results?.length) return null;

  const config = getTrailLayerConfig(mapLayerId, existingTrails, proposedTrails);
  if (!config) return results[0];

  return results.find((result) => result.layerId === config["esri-id"]) || results[0];
};

export const buildTrailHighlightFromIdentify = (
  identifyResult,
  existingTrails,
  proposedTrails
) => {
  if (!identifyResult) return null;

  const config = [...existingTrails, ...proposedTrails].find(
    (layer) => layer["esri-id"] === identifyResult.layerId
  );
  if (!config) return null;

  const geometry = esriPolylineToGeoJSON(identifyResult.geometry);
  if (!geometry) return null;

  const paint = config.paint || {};

  return {
    featureId: getTrailFeatureIdFromAttributes(identifyResult.attributes),
    mapLayerId: config.id,
    feature: {
      type: "Feature",
      geometry,
      properties: identifyResult.attributes || {},
    },
    lineColor: paint["line-color"] || "#2774bd",
    lineDasharray: paint["line-dasharray"] || null,
  };
};

export const isSameTrailHighlight = (a, b) => {
  if (!a || !b) return false;
  if (a.mapLayerId !== b.mapLayerId) return false;

  if (a.featureId != null && b.featureId != null) {
    return String(a.featureId) === String(b.featureId);
  }

  return false;
};
