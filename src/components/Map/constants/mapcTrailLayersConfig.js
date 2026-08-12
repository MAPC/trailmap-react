// MapcTrails MapServer layer metadata (ids, labels, colors, status).
// https://geo.mapc.org/server/rest/services/MapcTrails/MapServer
//
// Used for FeatureServer queries, community-profile metrics, legend, and styling.
//
// status:
//   existing — built facilities (includes Paved Footway + Natural Surface Footway)
//   planned  — Planned Protected Bike Lanes only (layer 1)
//   proposed — all other non-existing layers

export const TRAIL_STATUS = {
  EXISTING: "existing",
  PLANNED: "planned",
  PROPOSED: "proposed",
};

/** MapServer layers 0–11: id, display name, map color, and build status. */
export const mapcTrailLayers = [
  {
    id: 0,
    name: "Existing Protected Bike Lanes",
    color: "#2166AC",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 1,
    name: "Planned Protected Bike Lanes",
    color: "#2166AC",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PLANNED,
  },
  {
    id: 2,
    name: "Existing Bike Lanes",
    color: "#92C5DE",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 3,
    name: "Proposed Bike Lanes",
    color: "#92C5DE",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 4,
    name: "Paved Footway",
    color: "#903366",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 5,
    name: "Proposed Paved Footway",
    color: "#903366",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 6,
    name: "Natural Surface Footway",
    color: "#A87196",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 7,
    name: "Proposed Natural Surface Footway",
    color: "#A87196",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 8,
    name: "Existing Paved Shared Use Paths",
    color: "#214A2D",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 9,
    name: "Proposed Paved Shared Use Paths",
    color: "#214A2D",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 10,
    name: "Proposed Unimproved Shared Use Paths",
    color: "#4BAA40",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 11,
    name: "Existing Unimproved Shared Use Paths",
    color: "#4BAA40",
    status: TRAIL_STATUS.EXISTING,
  },
];

/**
 * Existing MapServer layer + its planned/proposed counterparts.
 * Drives All Trail Types and Completion Rates in the community profile.
 */
export const mapcTrailFacilityPairs = [
  { existingId: 0, otherIds: [1], label: "Protected Bike Lanes" },
  { existingId: 2, otherIds: [3], label: "Bike Lanes" },
  { existingId: 4, otherIds: [5], label: "Paved Footway" },
  { existingId: 6, otherIds: [7], label: "Natural Surface Footway" },
  { existingId: 8, otherIds: [9], label: "Paved Shared Use Paths" },
  { existingId: 11, otherIds: [10], label: "Unimproved Shared Use Paths" },
];

const layerById = Object.fromEntries(
  mapcTrailLayers.map((layer) => [layer.id, layer])
);

export const getTrailLayerById = (layerId) => layerById[layerId] || null;

export const getTrailStatus = (trailOrLayer) => {
  if (!trailOrLayer) return null;

  if (trailOrLayer.status) return trailOrLayer.status;

  const layerId =
    trailOrLayer.layerId ?? trailOrLayer.id ?? trailOrLayer.esriId;
  if (layerId != null && layerById[layerId]) {
    return layerById[layerId].status;
  }

  const name = trailOrLayer.layerName || trailOrLayer.name || "";
  if (name.startsWith("Planned")) return TRAIL_STATUS.PLANNED;
  if (name.startsWith("Proposed")) return TRAIL_STATUS.PROPOSED;
  return TRAIL_STATUS.EXISTING;
};
