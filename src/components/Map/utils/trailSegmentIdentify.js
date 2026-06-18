import axios from "axios";

const TRAILMAP_IDENTIFY_SOURCE = process.env.REACT_APP_TRAIL_MAP_IDENTIFY_URL;
const TRAILMAP_FEATURE_SERVER_BASE = process.env.REACT_APP_TRAIL_MAP_FEATURE_SERVER_BASE;

export const esriPolylineToGeoJSON = (geometry) => {
  if (!geometry?.paths?.length) return null;

  const paths = geometry.paths;
  if (paths.length === 1) {
    return { type: "LineString", coordinates: paths[0] };
  }

  return { type: "MultiLineString", coordinates: paths };
};

export const identifyTrailSegmentsAtPoint = async ({
  lng,
  lat,
  mapBounds,
  visibleEsriLayerIds,
  tolerance = 5,
  returnGeometry = true,
}) => {
  if (!TRAILMAP_IDENTIFY_SOURCE || !visibleEsriLayerIds?.length) return [];

  const response = await axios.get(TRAILMAP_IDENTIFY_SOURCE, {
    params: {
      geometry: `${lng},${lat}`,
      geometryType: "esriGeometryPoint",
      sr: 4326,
      layers: `visible:${visibleEsriLayerIds.join(",")}`,
      tolerance,
      mapExtent: `${mapBounds._sw.lng},${mapBounds._sw.lat},${mapBounds._ne.lng},${mapBounds._ne.lat}`,
      imageDisplay: "600,550,96",
      returnGeometry,
      f: "pjson",
    },
  });

  if (response?.data?.error) {
    console.error("Trail identify error:", response.data.error);
    return [];
  }

  return response?.data?.results || [];
};

export const fetchTrailSegmentGeoJSON = async (esriLayerId, objectid) => {
  if (!TRAILMAP_FEATURE_SERVER_BASE || esriLayerId == null || objectid == null) {
    return null;
  }

  const response = await axios.get(`${TRAILMAP_FEATURE_SERVER_BASE}/${esriLayerId}/query`, {
    params: {
      where: `objectid=${objectid}`,
      outFields: "*",
      returnGeometry: true,
      outSR: 4326,
      f: "geojson",
    },
  });

  return response?.data?.features?.[0] || null;
};
