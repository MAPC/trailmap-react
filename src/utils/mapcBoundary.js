import bbox from "@turf/bbox";
import { WebMercatorViewport } from "@math.gl/web-mercator";
import massachusettsData from "../data/massachusetts.json";
import maMuniKeys from "../data/ma_muni_keys.json";

const MAPC_TOWN_IDS = new Set(
  maMuniKeys.filter((muni) => muni.mapc === 1).map((muni) => Number(muni.muni_id))
);

/**
 * FeatureCollection of municipality polygons in the MAPC region
 * (ma_muni_keys.mapc === 1), using geometries from massachusetts.json.
 */
export const mapcBoundaryData = {
  type: "FeatureCollection",
  features: (massachusettsData.features || []).filter((feature) =>
    MAPC_TOWN_IDS.has(Number(feature.properties?.town_id))
  ),
};

const [minLng, minLat, maxLng, maxLat] = bbox(mapcBoundaryData);
const fittedMapcViewport = new WebMercatorViewport({
  width: 1200,
  height: 800,
}).fitBounds(
  [
    [minLng, minLat],
    [maxLng, maxLat],
  ],
  { padding: 48 }
);

/** Default Trails Overview camera centered on the MAPC region. */
export const MAPC_OVERVIEW_VIEWPORT = {
  latitude: fittedMapcViewport.latitude,
  longitude: fittedMapcViewport.longitude,
  zoom: fittedMapcViewport.zoom,
  transitionDuration: 1000,
};
