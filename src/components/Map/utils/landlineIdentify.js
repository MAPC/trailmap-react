import { esriPolylineToGeoJSON } from "./trailSegmentIdentify";

/** Same service the regional map draws LandLine from. */
export const LANDLINES_SERVICE_URL =
  "https://geo.mapc.org/server/rest/services/MapcLandlines/MapServer/0";

/** Labels from landlines unique-value renderer (seg_type, fac_stat). */
const LANDLINE_TYPE_LABELS = {
  "1,1": "Shared Use Path - Existing",
  "1,2": "Shared Use Path - Design",
  "1,3": "Shared Use Path - Envisioned",
  "2,1": "Protected Bike Lane and Sidewalk",
  "2,2": "Protected Bike Lane - Design or Construction",
  "2,3": "Protected Bike Lane - Design or Construction",
  "3,1": "Bike Lane and Sidewalk",
  "3,2": "Bike Lane - Design or Construction",
  "3,3": "Bike Lane - Design or Construction",
  "4,1": "Shared Street - Urban",
  "4,3": "Shared Street - Urban",
  "5,1": "Shared Street - Suburban",
  "5,3": "Shared Street - Envisioned",
  "6,1": "Shared Use Path - Unimproved Surface",
  "6,2": "Shared Use Path - Unimproved Surface",
  "6,3": "Shared Use Path - Unimproved Surface",
  "9,1": "Gap - Facility Type TBD",
  "9,2": "Gap - Facility Type TBD",
  "9,3": "Gap - Facility Type TBD",
  "11,1": "Foot Trail - Natural Surface",
  "11,2": "Foot Trail - Envisioned Natural Surface",
  "11,3": "Foot Trail - Envisioned Natural Surface",
  "12,1": "Foot Trail - Roadway Section",
  "12,2": "Foot Trail - Envisioned Roadway Section",
  "12,3": "Foot Trail - Envisioned Roadway Section",
};

const toRad = (degrees) => (degrees * Math.PI) / 180;

const distPointToSegmentMeters = (lng, lat, a, b) => {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(toRad(lat));
  const ax = (a[0] - lng) * metersPerDegLng;
  const ay = (a[1] - lat) * metersPerDegLat;
  const bx = (b[0] - lng) * metersPerDegLng;
  const by = (b[1] - lat) * metersPerDegLat;
  const abx = bx - ax;
  const aby = by - ay;
  const abLen2 = abx * abx + aby * aby;
  if (abLen2 === 0) return Math.hypot(ax, ay);
  const t = Math.max(0, Math.min(1, (-ax * abx - ay * aby) / abLen2));
  return Math.hypot(ax + t * abx, ay + t * aby);
};

const distanceToPaths = (lng, lat, paths = []) => {
  let min = Infinity;
  paths.forEach((path) => {
    if (!path?.length) return;
    if (path.length === 1) {
      min = Math.min(min, distPointToSegmentMeters(lng, lat, path[0], path[0]));
      return;
    }
    for (let i = 1; i < path.length; i += 1) {
      min = Math.min(min, distPointToSegmentMeters(lng, lat, path[i - 1], path[i]));
    }
  });
  return min;
};

export const distanceToLandlineGeometry = (lng, lat, geometry) => {
  if (!geometry) return Infinity;
  if (geometry.paths?.length) {
    return distanceToPaths(lng, lat, geometry.paths);
  }
  if (geometry.type === "LineString") {
    return distanceToPaths(lng, lat, [geometry.coordinates]);
  }
  if (geometry.type === "MultiLineString") {
    return distanceToPaths(lng, lat, geometry.coordinates);
  }
  return Infinity;
};

export const metersPerPixelAt = (lat, zoom) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

export const getLandlineObjectId = (props = {}) => {
  const id =
    props.OBJECTID ??
    props.objectid ??
    props.ObjectID ??
    props.FID ??
    props.fid ??
    null;
  if (id == null || id === "") return null;
  return String(id);
};

export const pickClosestLandlineFeature = (features = [], lngLat) => {
  if (!features.length) return null;
  if (!lngLat) return features[0];

  let closest = features[0];
  let closestDistance = Infinity;
  features.forEach((feature) => {
    const distance = distanceToLandlineGeometry(
      lngLat.lng,
      lngLat.lat,
      feature.geometry
    );
    if (distance < closestDistance) {
      closest = feature;
      closestDistance = distance;
    }
  });
  return closest;
};

export const LANDLINE_HIT_LAYER_ID = "landlines-hit-layer";

export const getLandlineLayerIds = () => [LANDLINE_HIT_LAYER_ID];

export const isLandlineLayerId = (layerId) => {
  const id = String(layerId || "");
  return id === LANDLINE_HIT_LAYER_ID || id.startsWith("landlines-layer-");
};

export const getLandlineFacilityLabel = (attributes = {}) => {
  const segType = attributes.seg_type ?? attributes.SEG_TYPE;
  const facStat = attributes.fac_stat ?? attributes.FAC_STAT;
  if (segType == null || facStat == null) return "LandLine Facility";
  return (
    LANDLINE_TYPE_LABELS[`${segType},${facStat}`] || "LandLine Facility"
  );
};

export const landlineMapFeatureToIdentifyResult = (feature) => ({
  layerId: "landline",
  layerName: getLandlineFacilityLabel(feature?.properties || {}),
  attributes: feature?.properties || {},
  geometry: feature?.geometry,
});

export const queryLandlineFeaturesAtEvent = (map, event) => {
  const fromEvent = (event?.features || []).filter((feature) =>
    isLandlineLayerId(feature.layer?.id)
  );
  if (fromEvent.length) return fromEvent;
  if (!map || !event?.point) return [];

  const existingIds = (map.getStyle()?.layers || [])
    .map((layer) => layer.id)
    .filter(
      (id) =>
        id === LANDLINE_HIT_LAYER_ID || String(id).startsWith("landlines-layer-")
    );
  if (!existingIds.length) return [];

  const { x, y } = event.point;
  const zoom = map.getZoom?.() ?? 12;
  const padding = zoom < 11 ? 16 : 12;

  try {
    return map.queryRenderedFeatures(
      [
        [x - padding, y - padding],
        [x + padding, y + padding],
      ],
      { layers: existingIds }
    );
  } catch (err) {
    console.warn("Error querying LandLine features at click:", err.message);
    return [];
  }
};

/**
 * Query the same LandLine service the map draws, nearest to a click.
 * Uses a small envelope because MapServer point queries often miss lines.
 */
export const identifyLandlineAtPoint = async ({
  lng,
  lat,
  distanceMeters = 25,
  objectId = null,
}) => {
  const latPad = distanceMeters / 111320;
  const lngPad =
    distanceMeters / (111320 * Math.max(0.01, Math.cos(toRad(lat))));
  const params = new URLSearchParams({
    where: "reg_name IS NOT NULL",
    geometry: `${lng - lngPad},${lat - latPad},${lng + lngPad},${lat + latPad}`,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "20",
    f: "json",
  });

  const response = await fetch(
    `${LANDLINES_SERVICE_URL}/query?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Landline identify failed (${response.status})`);
  }

  const data = await response.json();
  const results = (data?.features || []).map((feature) => {
    const attributes = feature.attributes || {};
    return {
      layerId: "landline",
      layerName: getLandlineFacilityLabel(attributes),
      attributes,
      geometry: feature.geometry,
    };
  });

  results.sort(
    (a, b) =>
      distanceToLandlineGeometry(lng, lat, a.geometry) -
      distanceToLandlineGeometry(lng, lat, b.geometry)
  );

  const matchedId = objectId == null ? null : String(objectId);
  if (matchedId) {
    const matchedIndex = results.findIndex(
      (result) => getLandlineObjectId(result.attributes) === matchedId
    );
    if (matchedIndex > 0) {
      const [matched] = results.splice(matchedIndex, 1);
      results.unshift(matched);
    }
  }

  return results.slice(0, 5);
};

export const getLandlineHighlightFeature = (identifyResult) => {
  const geometry =
    identifyResult?.geometry?.type
      ? identifyResult.geometry
      : esriPolylineToGeoJSON(identifyResult?.geometry);
  if (!geometry) return null;

  return {
    type: "Feature",
    geometry,
    properties: identifyResult.attributes || identifyResult.properties || {},
  };
};
