import { Buffer } from "buffer";
import wkx from "wkx";

/**
 * Convert a PostGIS EWKB hex string to a GeoJSON geometry.
 */
export function parseEwkbHex(hex) {
  if (!hex || typeof hex !== "string") return null;
  return wkx.Geometry.parse(Buffer.from(hex, "hex")).toGeoJSON();
}

/**
 * Convert API rows ({ geom: ewkbHex, ...attrs }) to a GeoJSON FeatureCollection.
 */
export function openSpaceRowsToGeoJSON(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const features = [];
  for (const row of rows) {
    try {
      const geometry = parseEwkbHex(row.geom);
      if (!geometry) continue;

      const { geom, ...properties } = row;
      features.push({
        type: "Feature",
        geometry,
        properties,
      });
    } catch (err) {
      console.warn("Failed to parse open space geometry:", row?.id, err);
    }
  }

  return { type: "FeatureCollection", features };
}
