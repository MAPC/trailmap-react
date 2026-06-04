export const EJ2020_MAP_SERVER_URL =
  process.env.REACT_APP_EJ2020_MAP_SERVER_URL ||
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer";

/**
 * Maps seg_type,fac_stat to human-readable labels (Regional / Project Trails Profile).
 * fac_stat: 1 = Existing, 2 = Design/Construction, 3 = Envisioned
 */
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
  "12,3": "Foot Trail - Envisioned Roadway Section",
};
