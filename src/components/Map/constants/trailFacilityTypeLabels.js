export const EJ2020_MAP_SERVER_URL = process.env.REACT_APP_EJ2020_MAP_SERVER_URL 
export const GAP_FACILITY_TYPE_LABEL = "Gap - Facility Type TBD";
/**
 * ArcGIS Facility Type names by seg_type ID.
 * fac_stat: 1 = Existing, 2 = Design/Construction, 3 = Envisioned
 */
export const SEG_TYPE_NAMES = {
  1: "Shared Use Path - Existing",
  2: "Protected Bike Lane and Sidewalk",
  3: "Bike Lane and Sidewalk",
  4: "Shared Street - Urban",
  5: "Shared Street - Suburban",
  6: "Shared Use Path - Unimproved Surface",
  9: GAP_FACILITY_TYPE_LABEL,
  11: "Foot Trail - Natural Surface",
  12: "Foot Trail - Roadway Section",
};

/**
 * Maps seg_type,fac_stat to human-readable labels (Regional / Project Trails Profile).
 */
export const TRAIL_FACILITY_TYPE_LABELS = {
  "1,1": "Shared Use Path - Existing",
  "1,2": "Shared Use Path - Design",
  "1,3": "Shared Use Path - Envisioned",
  "6,1": "Shared Use Path - Unimproved Surface",
  "6,2": "Shared Use Path - Unimproved Surface",
  "6,3": "Shared Use Path - Unimproved Surface",
  "2,1": "Protected Bike Lane and Sidewalk",
  "2,2": "Protected Bike Lane - Design or Construction",
  "2,3": "Protected Bike Lane - Design or Construction",
  "3,1": "Bike Lane and Sidewalk",
  "3,2": "Bike Lane - Design or Construction",
  "3,3": "Bike Lane - Design or Construction",
  "4,1": "Shared Street - Urban",
  "4,3": "Shared Street - Urban",
  "5,1": "Shared Street - Suburban",
  "5,3": "Shared Street - Envisioned",
  "9,1": "Gap",
  "9,2": "Gap",
  "9,3": "Gap", 
  "11,1": "Foot Trail - Natural Surface",
  "11,2": "Foot Trail - Envisioned Natural Surface",
  "11,3": "Foot Trail - Envisioned Natural Surface",
  "12,1": "Foot Trail - Roadway Section",
  "12,2": "Foot Trail - Envisioned Roadway Section",
  "12,3": "Foot Trail - Envisioned Roadway Section",
};


export const LENGTH_BY_TYPE_EXISTING_ORDER = [
  "Foot Trail - Natural Surface",
  "Shared Use Path - Existing",
  "Shared Street - Urban",
  "Shared Street - Suburban",
  "Bike Lane and Sidewalk",
  "Shared Use Path - Unimproved Surface",
  "Protected Bike Lane and Sidewalk",
  "Foot Trail - Roadway Section",
];


export const LENGTH_BY_TYPE_PLANNED_ORDER = [
  "Foot Trail - Envisioned Natural Surface",
  "Protected Bike Lane - Design or Construction",
  "Bike Lane - Design or Construction",
  "Shared Street - Envisioned",
  "Shared Use Path - Envisioned",
  "Shared Use Path - Design",
  "Foot Trail - Envisioned Roadway Section",
  "Shared Street - Urban",
  "Shared Use Path - Unimproved Surface",
];

export const getTrailFacilityTypeLabel = (segType, facStat) => {
  const key = `${segType},${facStat}`;
  if (TRAIL_FACILITY_TYPE_LABELS[key]) {
    return TRAIL_FACILITY_TYPE_LABELS[key];
  }
  if (String(facStat) === "1" && SEG_TYPE_NAMES[segType]) {
    return SEG_TYPE_NAMES[segType];
  }
  return null;
};

const getLengthByTypeOrderIndex = (type, category) => {
  const order =
    category === "existing"
      ? LENGTH_BY_TYPE_EXISTING_ORDER
      : category === "planned"
        ? LENGTH_BY_TYPE_PLANNED_ORDER
        : null;

  if (!order) return Number.MAX_SAFE_INTEGER;
  const index = order.indexOf(type);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

export const sortLengthByTypeItems = (items = [], category) => {
  if (category === "gap") {
    return [...items].sort((a, b) => Number(b.miles) - Number(a.miles));
  }

  return [...items].sort((a, b) => {
    const orderDiff =
      getLengthByTypeOrderIndex(a.type, category) -
      getLengthByTypeOrderIndex(b.type, category);
    if (orderDiff !== 0) return orderDiff;
    return Number(b.miles) - Number(a.miles);
  });
};
