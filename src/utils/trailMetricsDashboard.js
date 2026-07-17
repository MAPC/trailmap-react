import massachusettsData from "../data/massachusetts.json";
import maMuniKeys from "../data/ma_muni_keys.json";

const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL ||
  "https://trailmap-backend-d66ee5db7604.herokuapp.com"
).replace(/\/$/, "");

const TRAIL_METRICS_API_URL =
  process.env.REACT_APP_TRAIL_METRICS_API_URL ||
  `${BACKEND_URL}/api/trail-metrics?token=trailmap`;

const SPECIAL_MUNI_NAMES = {
  "-1": "Outside municipalities",
  0: "Unmapped municipality",
};

export const DASHBOARD_SCOPES = {
  MAPC: "mapc",
  MASSACHUSETTS: "massachusetts",
};

const MAPC_MUNI_IDS = new Set(
  maMuniKeys.filter((municipality) => municipality.mapc === 1).map((municipality) => municipality.muni_id)
);

export const MASSACHUSETTS_MUNI_COUNT = maMuniKeys.length;
export const MAPC_MUNI_COUNT = MAPC_MUNI_IDS.size;

export const TRAIL_TYPE_GROUPS = [
  {
    key: "sharedUsePaths",
    label: "Shared-use paths",
    existingLabel: "Existing shared-use paths",
    existingKeys: [
      "existing_paved_shared_use_paths_length_mi",
      "existing_unimproved_shared_use_paths_length_mi",
    ],
    plannedKeys: [],
    proposedKeys: [
      "proposed_paved_shared_use_paths_length_mi",
      "proposed_unimproved_shared_use_paths_length_mi",
    ],
    color: "#2774bd",
  },
  {
    key: "footways",
    label: "Footways",
    existingLabel: "Existing footways",
    existingKeys: [
      "paved_footway_length_mi",
      "natural_surface_footway_length_mi",
    ],
    plannedKeys: [],
    proposedKeys: [
      "proposed_paved_footway_length_mi",
      "proposed_natural_surface_footway_length_mi",
    ],
    color: "#2e8b57",
  },
  {
    key: "bikeFacilities",
    label: "Bike facilities",
    existingLabel: "Existing bike facilities",
    existingKeys: [
      "existing_protected_bike_lanes_length_mi",
      "existing_bike_lanes_length_mi",
    ],
    plannedKeys: ["planned_protected_bike_lanes_length_mi"],
    proposedKeys: ["proposed_bike_lanes_length_mi"],
    color: "#e67e22",
  },
];

export const TRAIL_STATUS_OPTIONS = [
  { key: "existing", label: "Existing" },
  { key: "planned", label: "Planned" },
  { key: "proposed", label: "Proposed" },
];

const sumKeys = (row, keys) =>
  keys.reduce((total, key) => total + (Number(row[key]) || 0), 0);

const getStatusKeys = (group, statusKey) => {
  if (statusKey === "existing") {
    return group.existingKeys;
  }

  if (statusKey === "planned") {
    return group.plannedKeys || [];
  }

  if (statusKey === "proposed") {
    return group.proposedKeys || [];
  }

  return [];
};

export const getMunicipalityTrailTypeMiles = (row, facilityTypeKey, statusKey) => {
  const group = TRAIL_TYPE_GROUPS.find((item) => item.key === facilityTypeKey);
  if (!group) return 0;

  return sumKeys(row, getStatusKeys(group, statusKey));
};

export const getTopMunicipalitiesByTrailType = (
  municipalities,
  facilityTypeKey,
  statusKey,
  limit = 10
) =>
  [...municipalities]
    .map((row) => ({
      ...row,
      trailTypeMiles: getMunicipalityTrailTypeMiles(row, facilityTypeKey, statusKey),
    }))
    .filter((row) => row.trailTypeMiles > 0)
    .sort((a, b) => b.trailTypeMiles - a.trailTypeMiles)
    .slice(0, limit);

export const formatMiles = (miles) => {
  const value = Number(miles) || 0;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: value >= 100 ? 1 : 2,
    maximumFractionDigits: value >= 100 ? 1 : 2,
  });
};

export const capitalizeWords = (value) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const buildMunicipalityLookup = () => {
  const byMuniId = new Map();
  const areaByMuniId = new Map();
  const slugByMuniId = new Map();

  massachusettsData.features.forEach((feature) => {
    const { town_id: townId, town, sum_square: sumSquare } = feature.properties;
    if (townId == null) return;

    byMuniId.set(townId, capitalizeWords(town));
    areaByMuniId.set(townId, Number(sumSquare) || 0);
    if (town) {
      slugByMuniId.set(townId, town.toLowerCase());
    }
  });

  return { byMuniId, areaByMuniId, slugByMuniId };
};

export const getCommunityProfileUrl = (muniId, lookup) => {
  const normalizedMuniId = Number(muniId);
  if (!normalizedMuniId || normalizedMuniId <= 0) return null;

  const slug = lookup.slugByMuniId.get(normalizedMuniId);
  if (!slug) return null;

  return `/communityTrailsProfile?muni=${encodeURIComponent(slug)}`;
};

export const getMunicipalityName = (muniId, lookup) => {
  if (muniId == null) return "Unknown";
  if (Object.prototype.hasOwnProperty.call(SPECIAL_MUNI_NAMES, muniId)) {
    return SPECIAL_MUNI_NAMES[muniId];
  }

  return lookup.byMuniId.get(muniId) || `Municipality ${muniId}`;
};

export const enrichTrailMetricsRows = (rows, lookup) =>
  rows.map((row) => {
    const existingMiles = Number(row.total_existing_length_mi) || 0;
    const plannedMiles = Number(row.total_planned_length_mi) || 0;
    const proposedMiles = Number(row.total_proposed_length_mi) || 0;
    const totalMiles = existingMiles + plannedMiles + proposedMiles;
    const areaSqMi = lookup.areaByMuniId.get(row.muni_id) || 0;
    const density = areaSqMi > 0 ? existingMiles / areaSqMi : null;

    const byType = TRAIL_TYPE_GROUPS.map((group) => {
      const existing = sumKeys(row, group.existingKeys);
      const planned = sumKeys(row, group.plannedKeys || []);
      const proposed = sumKeys(row, group.proposedKeys || []);
      return {
        ...group,
        existing,
        planned,
        proposed,
        total: existing + planned + proposed,
      };
    });

    return {
      ...row,
      municipalityName: getMunicipalityName(row.muni_id, lookup),
      communityProfileUrl: getCommunityProfileUrl(row.muni_id, lookup),
      isMapc: MAPC_MUNI_IDS.has(Number(row.muni_id)),
      existingMiles,
      plannedMiles,
      proposedMiles,
      totalMiles,
      density,
      areaSqMi,
      plannedShare: totalMiles > 0 ? (plannedMiles / totalMiles) * 100 : 0,
      byType,
    };
  });

export const filterRowsByScope = (rows, scope) => {
  if (scope === DASHBOARD_SCOPES.MASSACHUSETTS) {
    return rows.filter((row) => Number(row.muni_id) > 0);
  }

  return rows.filter((row) => Number(row.muni_id) > 0 && row.isMapc);
};

const getScopeMunicipalityIds = (scope) => {
  if (scope === DASHBOARD_SCOPES.MASSACHUSETTS) {
    return maMuniKeys
      .map((municipality) => Number(municipality.muni_id))
      .filter((muniId) => muniId > 0);
  }

  return maMuniKeys
    .filter((municipality) => municipality.mapc === 1)
    .map((municipality) => Number(municipality.muni_id))
    .filter((muniId) => muniId > 0);
};

export const getMunicipalitiesWithoutTrailData = (rows, scope) => {
  const lookup = buildMunicipalityLookup();
  const trackedIds = new Set(
    rows
      .filter((row) => Number(row.muni_id) > 0)
      .map((row) => Number(row.muni_id))
  );

  return getScopeMunicipalityIds(scope)
    .filter((muniId) => !trackedIds.has(muniId))
    .map((muniId) => ({
      muni_id: muniId,
      municipalityName: getMunicipalityName(muniId, lookup),
    }))
    .sort((a, b) => a.municipalityName.localeCompare(b.municipalityName));
};

export const computeTrailMetricsInsights = (rows, scope) => {
  const municipalities = rows.filter((row) => row.muni_id > 0);
  const statewideExisting = rows.reduce(
    (sum, row) => sum + row.existingMiles,
    0
  );
  const statewidePlanned = rows.reduce(
    (sum, row) => sum + row.plannedMiles,
    0
  );
  const statewideProposed = rows.reduce(
    (sum, row) => sum + row.proposedMiles,
    0
  );

  const byTypeTotals = TRAIL_TYPE_GROUPS.map((group) => {
    const existing = municipalities.reduce(
      (sum, row) => sum + sumKeys(row, group.existingKeys),
      0
    );
    const planned = municipalities.reduce(
      (sum, row) => sum + sumKeys(row, group.plannedKeys || []),
      0
    );
    const proposed = municipalities.reduce(
      (sum, row) => sum + sumKeys(row, group.proposedKeys || []),
      0
    );

    return {
      ...group,
      existing,
      planned,
      proposed,
      total: existing + planned + proposed,
    };
  });

  const topByExisting = [...municipalities]
    .sort((a, b) => b.existingMiles - a.existingMiles)
    .slice(0, 10);

  const topByPlanned = [...municipalities]
    .sort((a, b) => b.plannedMiles - a.plannedMiles)
    .slice(0, 10);

  const topByProposed = [...municipalities]
    .sort((a, b) => b.proposedMiles - a.proposedMiles)
    .slice(0, 10);

  const topByDensity = [...municipalities]
    .filter((row) => row.density != null)
    .sort((a, b) => b.density - a.density)
    .slice(0, 10);

  const municipalitiesWithoutTrailData = scope
    ? getMunicipalitiesWithoutTrailData(rows, scope)
    : [];

  return {
    municipalityCount: municipalities.length,
    municipalitiesWithoutTrailData,
    statewideExisting,
    statewidePlanned,
    statewideProposed,
    byTypeTotals,
    topByExisting,
    topByPlanned,
    topByProposed,
    topByDensity,
    municipalities,
    rows: [...rows].sort((a, b) =>
      a.municipalityName.localeCompare(b.municipalityName)
    ),
  };
};

const buildTrailMetricsRequestUrl = (scope) => {
  const url = new URL(TRAIL_METRICS_API_URL, window.location.origin);
  url.searchParams.set("scope", scope);
  return url.toString();
};

export const fetchTrailMetricsDashboardData = async (
  scope = DASHBOARD_SCOPES.MAPC
) => {
  const response = await fetch(buildTrailMetricsRequestUrl(scope));

  if (!response.ok) {
    throw new Error("Unable to load trail metrics. Please try again later.");
  }

  const { fields = [], rows = [] } = await response.json();
  const municipalityLookup = buildMunicipalityLookup();
  const enrichedRows = enrichTrailMetricsRows(rows, municipalityLookup);

  return {
    fields,
    enrichedRows,
  };
};
