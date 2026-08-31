import maMuniKeys from "../data/ma_muni_keys.json";

const MAPC_TOWN_IDS = new Set(
  maMuniKeys.filter((muni) => muni.mapc === 1).map((muni) => Number(muni.muni_id))
);

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
