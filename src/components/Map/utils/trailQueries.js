import { mapcTrailLayers } from "../constants/mapcTrailLayersConfig";

const FEATURE_SERVER_BASE = process.env.REACT_APP_TRAIL_MAP_FEATURE_SERVER_BASE;

/**
 * Convert GeoJSON Polygon/MultiPolygon to ESRI Polygon JSON
 */
export const geojsonPolygonToEsriPolygon = (geometry) => {
  // GeoJSON Polygon/MultiPolygon (lon/lat, EPSG:4326) -> ESRI Polygon JSON
  if (!geometry || !geometry.type || !geometry.coordinates) return null;

  const toRingsFromPolygonCoords = (polyCoords) =>
    polyCoords.map((ring) => ring.map(([lng, lat]) => [lng, lat]));

  let rings = [];
  if (geometry.type === "Polygon") {
    rings = toRingsFromPolygonCoords(geometry.coordinates);
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polyCoords) => {
      rings = rings.concat(toRingsFromPolygonCoords(polyCoords));
    });
  } else {
    return null;
  }

  return { rings, spatialReference: { wkid: 4326 } };
};

/**
 * Convert ESRI Polyline to GeoJSON
 */
export const esriPolylineToGeoJSON = (esriGeom) => {
  if (!esriGeom || !esriGeom.paths) return null;
  const paths = esriGeom.paths;
  if (!Array.isArray(paths) || paths.length === 0) return null;
  if (paths.length === 1) return { type: "LineString", coordinates: paths[0] };
  return { type: "MultiLineString", coordinates: paths };
};

/**
 * Ensure length_ft field is normalized to number
 */
export const ensureLengthFeet = (attributes, geojsonGeometry) => {
  // Use the source `length_ft` field directly (no fallback / no computed length).
  if (!attributes) attributes = {};
  // Normalize to number when present; otherwise leave as-is/undefined.
  if (attributes.length_ft != null) {
    attributes.length_ft = Number(attributes.length_ft) || 0;
  }
  return attributes;
};

/**
 * Fetch all features for a layer with pagination support
 */
export const fetchAllFeaturesForLayer = async ({ layerId, esriPolygon }) => {
  if (!FEATURE_SERVER_BASE) {
    throw new Error("REACT_APP_TRAIL_MAP_FEATURE_SERVER_BASE is not set");
  }

  const all = [];
  const pageSize = 2000;
  let offset = 0;

  while (true) {
    const params = new URLSearchParams();
    params.set("where", "1=1");
    params.set("geometry", JSON.stringify(esriPolygon));
    params.set("geometryType", "esriGeometryPolygon");
    params.set("spatialRel", "esriSpatialRelIntersects");
    params.set("inSR", "4326");
    params.set("outSR", "4326");
    params.set("outFields", "*");
    params.set("returnGeometry", "true");
    params.set("f", "pjson");
    params.set("resultOffset", String(offset));
    params.set("resultRecordCount", String(pageSize));

    // Use POST to avoid "request too long" for large polygons (e.g., Boston)
    const url = `${FEATURE_SERVER_BASE}/${layerId}/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(`FeatureServer query failed (${layerId}): ${res.status}`);
    const json = await res.json();
    const features = json?.features || [];
    all.push(...features);

    const exceeded = Boolean(json?.exceededTransferLimit);
    if (!exceeded && features.length < pageSize) break;
    if (features.length === 0) break;
    offset += features.length;
  }

  return all;
};

/**
 * Query municipality trails from FeatureServer
 */
export const queryMunicipalityTrails = async ({
  municipality,
  location,
  setIsQueryingTrails,
  setLoadingProgress,
  setLoadingMessage,
  setMunicipalityTrails,
  setIntersectedTrails,
  lastQueriedMunicipality
}) => {
  if (!municipality || !municipality.geometry) {
    setMunicipalityTrails([]);
    setIntersectedTrails([]);
    lastQueriedMunicipality.current = null;
    return;
  }

  // Check if we already queried this municipality
  if (lastQueriedMunicipality.current === municipality.name) {
    console.log("Already queried this municipality, skipping...");
    return;
  }

  setIsQueryingTrails(true);
  setMunicipalityTrails([]);
  setIntersectedTrails([]);
  setLoadingProgress(0);
  setLoadingMessage("Loading trail data...");
  console.log("Starting FeatureServer query for municipality:", municipality.name);

  try {
    const allTrailResults = [];
    const totalLayers = mapcTrailLayers.length;
    const isCommunityTrailsProfile = location?.pathname === "/communityTrailsProfile";
    const esriPolygon = geojsonPolygonToEsriPolygon(municipality.geometry);

    if (!esriPolygon) {
      console.error("Municipality geometry not supported for FeatureServer query");
      setMunicipalityTrails([]);
      setIntersectedTrails([]);
      return;
    }

    for (let i = 0; i < mapcTrailLayers.length; i++) {
      const layer = mapcTrailLayers[i];
      setLoadingMessage(`Querying ${layer.name}...`);
      setLoadingProgress((i / totalLayers) * 80);

      try {
        const features = await fetchAllFeaturesForLayer({
          layerId: layer.id,
          esriPolygon,
        });

        features.forEach((f) => {
          const geometry = esriPolylineToGeoJSON(f.geometry);
          const attributes = ensureLengthFeet(f.attributes || {}, geometry);

          allTrailResults.push({
            layerId: layer.id,
            layerName: layer.name,
            attributes,
            geometry,
            color: layer.color,
            feature: { type: "Feature", geometry, properties: attributes },
          });
        });
      } catch (error) {
        console.error(`Error querying FeatureServer layer ${layer.name}:`, error);
      }
    }

    setLoadingMessage("Finalizing results...");
    setLoadingProgress(90);

  

    setLoadingProgress(100);
    
    // Use all results without deduplication
    setMunicipalityTrails(allTrailResults);
    setIntersectedTrails(allTrailResults);
    lastQueriedMunicipality.current = municipality.name;

  } catch (error) {
    console.error("Error querying municipality trails:", error);
    setMunicipalityTrails([]);
    setIntersectedTrails([]);
  } finally {
    setIsQueryingTrails(false);
    setLoadingProgress(0);
    setLoadingMessage("");
  }
};

