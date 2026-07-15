import { openSpaceRowsToGeoJSON } from "./parseEwkb";

const OPEN_SPACE_API_URL =
  process.env.REACT_APP_OPEN_SPACE_API_URL || "/get-open-space";

/**
 * Fetch protected open space records for a municipality town_id.
 * Returns { rows, siteNames, featureCollection }.
 */
export async function fetchOpenSpaceByTownId(townId) {
  if (townId == null || townId === "") {
    return {
      rows: [],
      siteNames: [],
      featureCollection: { type: "FeatureCollection", features: [] },
    };
  }

  const url = `${OPEN_SPACE_API_URL}?token=trailmap&town_id=${townId}`;

  const response = await fetch(url);
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
