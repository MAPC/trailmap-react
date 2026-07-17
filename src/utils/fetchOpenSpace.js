import { openSpaceRowsToGeoJSON } from "./parseEwkb";

const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL ||
  "https://trailmap-backend-d66ee5db7604.herokuapp.com"
).replace(/\/$/, "");

const OPEN_SPACE_API_URL =
  process.env.REACT_APP_OPEN_SPACE_API_URL ||
  `${BACKEND_URL}/api/get-open-space`;

/**
 * Normalize town id(s) to a comma-separated API param, e.g. "1,3,4,5".
 */
export function formatTownIdsParam(townIds) {
  if (townIds == null || townIds === "") return "";

  if (Array.isArray(townIds)) {
    return [...new Set(townIds.map((id) => String(id).trim()).filter(Boolean))]
      .sort((a, b) => Number(a) - Number(b))
      .join(",");
  }

  const asString = String(townIds).trim();
  if (!asString) return "";

  if (asString.includes(",")) {
    return asString
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b))
      .join(",");
  }

  return asString;
}

/**
 * Fetch protected open space records for one or more municipality town_id values.
 * Accepts a single id, comma-separated string, or array of ids.
 * Returns { rows, siteNames, featureCollection }.
 */
export async function fetchOpenSpaceByTownId(townIds) {
  const townIdParam = formatTownIdsParam(townIds);
  if (!townIdParam) {
    return {
      rows: [],
      siteNames: [],
      featureCollection: { type: "FeatureCollection", features: [] },
    };
  }

  const response = await fetch(OPEN_SPACE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: "trailmap",
      town_id: townIdParam,
    }),
  });
  if (!response.ok) {
    throw new Error(`Open space API error: ${response.status}`);
  }

  const data = await response.json();
  const rows = Array.isArray(data.rows) ? data.rows : [];

  const siteNames = [
    ...new Set(
      rows
        .map((row) => (row.SITE_NAME || "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    rows,
    siteNames,
    featureCollection: openSpaceRowsToGeoJSON(rows),
  };
}
