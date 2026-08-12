import { Buffer } from "buffer";
import wkx from "wkx";
import proj4 from "proj4";

// MassGIS OpenSpace / MassGIS Towns use NAD83 / Massachusetts Mainland
proj4.defs(
  "EPSG:26986",
  "+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +datum=NAD83 +units=m +no_defs"
);

const reprojectPosition = (fromCrs, position) => {
  if (!Array.isArray(position) || position.length < 2) return position;
  const [x, y, ...rest] = position;
  const [lon, lat] = proj4(fromCrs, "EPSG:4326", [x, y]);
  return rest.length ? [lon, lat, ...rest] : [lon, lat];
};

const reprojectCoords = (fromCrs, coords) => {
  if (!Array.isArray(coords) || coords.length === 0) return coords;
  if (typeof coords[0] === "number") {
    return reprojectPosition(fromCrs, coords);
  }
  return coords.map((entry) => reprojectCoords(fromCrs, entry));
};

/**
 * Convert a PostGIS EWKB hex string to a GeoJSON geometry in EPSG:4326.
 * Open-space API geometries are typically EPSG:26986 (MA State Plane).
 */
export function parseEwkbHex(hex) {
  if (!hex || typeof hex !== "string") return null;

  const geometry = wkx.Geometry.parse(Buffer.from(hex, "hex"));
  const geojson = geometry.toGeoJSON();
  const srid = geometry.srid;

  if (!srid || srid === 4326) {
    return geojson;
  }

  const fromCrs = `EPSG:${srid}`;
  if (!proj4.defs(fromCrs)) {
    console.warn(`Unsupported open space SRID ${srid}; leaving coordinates unchanged`);
    return geojson;
  }

  return {
    ...geojson,
    coordinates: reprojectCoords(fromCrs, geojson.coordinates),
  };
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
