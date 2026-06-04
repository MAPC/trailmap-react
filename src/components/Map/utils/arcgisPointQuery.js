/**
 * Query an ArcGIS MapServer/FeatureServer layer at a point (point-in-polygon).
 * Useful for raster layers where client doesn't have vector data - query server for attributes at click location.
 *
 * @param {string} layerUrl - ArcGIS layer URL (e.g. https://.../MapServer/0)
 * @param {number} lng - Longitude (EPSG:4326)
 * @param {number} lat - Latitude (EPSG:4326)
 * @returns {Promise<object|null>} First feature containing the point, or null
 */
export const queryFeatureAtPoint = async (layerUrl, lng, lat) => {
  try {
    const toWebMercator = (lon, latVal) => {
      const x = lon * 20037508.34 / 180;
      const y = Math.log(Math.tan((90 + latVal) * Math.PI / 360)) / (Math.PI / 180);
      return { x, y: y * 20037508.34 / 180 };
    };

    const pointMerc = toWebMercator(lng, lat);
    const pointGeometry = {
      x: pointMerc.x,
      y: pointMerc.y,
      spatialReference: { wkid: 3857 }
    };

    const params = new URLSearchParams();
    params.set("where", "1=1");
    params.set("geometry", JSON.stringify(pointGeometry));
    params.set("geometryType", "esriGeometryPoint");
    params.set("inSR", "3857");
    params.set("spatialRel", "esriSpatialRelIntersects");
    params.set("outFields", "*");
    params.set("outSR", "4326");
    params.set("f", "geojson");
    params.set("returnGeometry", "true");

    const url = `${layerUrl}/query?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0];
    }
    return null;
  } catch (error) {
    console.error("Error querying feature at point:", error);
    return null;
  }
};
