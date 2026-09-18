import maMuniKeys from "../data/ma_muni_keys.json";

const MAPC_TOWN_IDS = new Set(
  maMuniKeys.filter((muni) => muni.mapc === 1).map((muni) => Number(muni.muni_id))
);

export const isMapcMunicipalityId = (muniId) =>
  MAPC_TOWN_IDS.has(Number(muniId));

export const isOutsideMapcRegion = (muniId) =>
  !isMapcMunicipalityId(muniId);

export const OUTSIDE_MAPC_DISCLAIMER_LABEL = "Data Disclaimer:";

export const OUTSIDE_MAPC_DISCLAIMER =
  "This community is located outside the MAPC region. Trailmap is MAPC’s regional walking and cycling map for Metro Boston, and trail data coverage and completeness may vary for communities outside the MAPC region. Please use this information as a reference and consult local or authoritative sources for the most current trail information.";

export const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection",
  features: [],
};

const getFeatureTownId = (feature) =>
  Number(feature.properties?.town_id ?? feature.properties?.muni_id);

/**
 * FeatureCollection of municipality polygons in the MAPC region
 * (ma_muni_keys.mapc === 1), using geometries from the municipal-boundaries API.
 */
export const buildMapcBoundaryData = (massachusettsData) => ({
  type: "FeatureCollection",
  features: (massachusettsData?.features || []).filter((feature) =>
    MAPC_TOWN_IDS.has(getFeatureTownId(feature))
  ),
});

/** Default Regional Trail Map camera centered on the MAPC region. */
export const MAPC_OVERVIEW_VIEWPORT = {
  latitude: 42.37167157000464,
  longitude: -71.11724911099999,
  zoom: 8.956025878980519,
  transitionDuration: 1000,
};
