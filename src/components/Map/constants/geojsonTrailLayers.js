// Layer definitions matching MapcTrails MapServer layer names/ids:
// https://geo.mapc.org/server/rest/services/MapcTrails/MapServer
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

export const geojsonTrailLayers = [
  {
    id: 0,
    name: "Existing Protected Bike Lanes",
    filename: "existing_protected_bike_lanes.json",
    color: "#2166AC",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 1,
    name: "Planned Protected Bike Lanes",
    filename: "planned_protected_bike_lanes.json",
    color: "#2166AC",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PLANNED,
  },
  {
    id: 2,
    name: "Existing Bike Lanes",
    filename: "existing_bike_lanes.json",
    color: "#92C5DE",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 3,
    name: "Proposed Bike Lanes",
    filename: "proposed_bike_lanes.json",
    color: "#92C5DE",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 4,
    name: "Paved Footway",
    filename: "paved_footway.json",
    color: "#903366",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 5,
    name: "Proposed Paved Footway",
    filename: "proposed_paved_footway.json",
    color: "#903366",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 6,
    name: "Natural Surface Footway",
    filename: "natural_surface_footway.json",
    color: "#A87196",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 7,
    name: "Proposed Natural Surface Footway",
    filename: "proposed_natural_surface_footway.json",
    color: "#A87196",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 8,
    name: "Existing Paved Shared Use Paths",
    filename: "existing_paved_shared_use_paths.json",
    color: "#214A2D",
    status: TRAIL_STATUS.EXISTING,
  },
  {
    id: 9,
    name: "Proposed Paved Shared Use Paths",
    filename: "proposed_paved_shared_use_paths.json",
    color: "#214A2D",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 10,
    name: "Proposed Unimproved Shared Use Paths",
    filename: "proposed_unimproved_shared_use_paths.json",
    color: "#4BAA40",
    dashArray: [2, 2],
    status: TRAIL_STATUS.PROPOSED,
  },
  {
    id: 11,
    name: "Existing Unimproved Shared Use Paths",
    filename: "existing_unimproved_shared_use_paths.json",
    color: "#4BAA40",
    status: TRAIL_STATUS.EXISTING,
  },
];

/** Facility type pairs for completion rates / All Trail Types bars */
export const trailFacilityTypePairs = [
  { existingId: 0, otherIds: [1], label: "Existing Protected Bike Lanes" },
  { existingId: 2, otherIds: [3], label: "Existing Bike Lanes" },
  { existingId: 4, otherIds: [5], label: "Paved Footway" },
  { existingId: 6, otherIds: [7], label: "Natural Surface Footway" },
  { existingId: 8, otherIds: [9], label: "Existing Paved Shared Use Paths" },
  { existingId: 11, otherIds: [10], label: "Existing Unimproved Shared Use Paths" },
];

const layerById = Object.fromEntries(
  geojsonTrailLayers.map((layer) => [layer.id, layer])
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
