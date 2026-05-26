/**
 * Map-related constants for trails, layers, and facility types.
 */

// -----------------------------------------------------------------------------
// Trails Profile Layers (Community Trails Profile)
// Layer definitions using local GeoJSON files.
// Colors match LayerData.js for consistency.
// -----------------------------------------------------------------------------
export const trailsProfileLayers = [
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

// -----------------------------------------------------------------------------
// Environmental Justice 2020 MapServer (for query and export)
// Fallback for when REACT_APP_EJ2020_MAP_SERVER_URL is not set (e.g. dev server not restarted)
// -----------------------------------------------------------------------------
export const EJ2020_MAP_SERVER_URL =
  process.env.REACT_APP_EJ2020_MAP_SERVER_URL ||
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer";

// -----------------------------------------------------------------------------
// Trail Facility Type Labels (Regional Trails / FeatureServer)
// Maps seg_type,fac_stat to human-readable labels for display in popups and UI.
// Key format: "seg_type,fac_stat" (e.g. "1,1" = Shared Use Path, Existing)
// fac_stat: 1 = Existing, 2 = Design/Construction, 3 = Envisioned
// -----------------------------------------------------------------------------
export const TRAIL_FACILITY_TYPE_LABELS = {
  "1,1": "Shared Use Path - Existing",
  "1,2": "Shared Use Path - Design",
  "1,3": "Shared Use Path - Envisioned",
  "6,3": "Shared Use Path - Unimproved Surface",
  "6,1": "Shared Use Path - Unimproved Surface",
  "6,2": "Shared Use Path - Unimproved Surface",
  "2,1": "Protected Bike Lane and Sidewalk",
  "2,2": "Protected Bike Lane - Design or Construction",
  "2,3": "Protected Bike Lane - Design or Construction",
  "3,1": "Bike Lane and Sidewalk",
  "3,2": "Bike Lane - Design or Construction",
  "3,3": "Bike Lane - Design or Construction",
  "4,3": "Shared Street - Urban",
  "4,1": "Shared Street - Urban",
  "5,1": "Shared Street - Suburban",
  "5,3": "Shared Street - Envisioned",
  "9,1": "Gap - Facility Type TBD",
  "9,2": "Gap - Facility Type TBD",
  "9,3": "Gap - Facility Type TBD",
  "11,1": "Foot Trail - Natural Surface",
  "11,3": "Foot Trail - Envisioned Natural Surface",
  "11,2": "Foot Trail - Envisioned Natural Surface",
  "12,1": "Foot Trail - Roadway Section",
  "12,2": "Foot Trail - Envisioned Roadway Section",
  "12,3": "Foot Trail - Envisioned Roadway Section"
};
