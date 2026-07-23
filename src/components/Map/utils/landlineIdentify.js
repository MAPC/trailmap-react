const LANDLINES_FEATURE_SERVER_URL =
  "https://geo.mapc.org/server/rest/services/transportation/landlines/FeatureServer/0";

/** Labels from landlines FeatureServer unique-value renderer (seg_type, fac_stat). */
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

export const getLandlineLayerIds = (landlineLayers = []) =>
  landlineLayers.map((layer) => layer.id).filter(Boolean);

export const isLandlineLayerId = (layerId, landlineLayers = []) =>
  getLandlineLayerIds(landlineLayers).includes(layerId);

export const getLandlineFacilityLabel = (attributes = {}) => {
  const segType = attributes.seg_type ?? attributes.SEG_TYPE;
  const facStat = attributes.fac_stat ?? attributes.FAC_STAT;
  if (segType == null || facStat == null) return "LandLine Facility";
  return (
    LANDLINE_TYPE_LABELS[`${segType},${facStat}`] || "LandLine Facility"
  );
};

/**
 * Query landlines FeatureServer near a click point and normalize to Identify popup shape.
 */
export const identifyLandlineAtPoint = async ({ lng, lat, distanceMeters = 40 }) => {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(distanceMeters),
    units: "esriSRUnit_Meter",
    outFields: "*",
    returnGeometry: "false",
    f: "json",
  });

  const response = await fetch(
    `${LANDLINES_FEATURE_SERVER_URL}/query?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Landline identify failed (${response.status})`);
  }

  const data = await response.json();
  const features = data?.features || [];

  return features.slice(0, 5).map((feature) => {
    const attributes = feature.attributes || {};
    return {
      layerId: "landline",
      layerName: getLandlineFacilityLabel(attributes),
      attributes,
    };
  });
};
