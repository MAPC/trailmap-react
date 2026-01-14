// GeoJSON trail layer definitions - using local files
// Colors match LayerData.js for consistency
export const geojsonTrailLayers = [
  { id: 0, name: "Protected Bike Lanes", filename: "existing_protected_bike_lanes.json", color: "#2166AC" },
  { id: 1, name: "Planned Protected Bike Lanes", filename: "planned_protected_bike_lanes.json", color: "#2166AC", dashArray: [2, 2] },
  { id: 2, name: "Bike Lanes", filename: "existing_bike_lanes.json", color: "#92C5DE" },
  { id: 3, name: "Planned Bike Lanes", filename: "proposed_bike_lanes.json", color: "#92C5DE", dashArray: [2, 2] },
  { id: 4, name: "Paved Foot Path", filename: "paved_footway.json", color: "#903366" },
  { id: 5, name: "Planned Paved Foot Path", filename: "proposed_paved_footway.json", color: "#903366", dashArray: [2, 2] },
  { id: 6, name: "Natural Surface Path", filename: "natural_surface_footway.json", color: "#A87196" },
  { id: 7, name: "Planned Natural Surface Path", filename: "proposed_natural_surface_footway.json", color: "#A87196", dashArray: [2, 2] },
  { id: 8, name: "Paved Shared Use", filename: "existing_paved_shared_use_paths.json", color: "#214A2D" },
  { id: 9, name: "Planned Paved Shared Use", filename: "proposed_paved_shared_use_paths.json", color: "#214A2D", dashArray: [2, 2] },
  { id: 10, name: "Planned Unimproved Shared Use", filename: "proposed_unimproved_shared_use_paths.json", color: "#4BAA40", dashArray: [2, 2] },
  { id: 11, name: "Unimproved Shared Use", filename: "existing_unimproved_shared_use_paths.json", color: "#4BAA40" }
];

