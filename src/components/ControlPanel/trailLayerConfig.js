export const TRAIL_LAYER_CATEGORIES = [
  {
    title: "SHARED-USE PATHS",
    items: [
      { existingId: "pavedPaths", proposedId: "pavedPathsProposed", label: "Existing Paved Shared Use Paths" },
      { existingId: "unimprovedPaths", proposedId: "unimprovedPathsProposed", label: "Existing Unimproved Shared Use Paths" },
    ],
  },
  {
    title: "BIKE FACILITIES",
    items: [
      { existingId: "bikeLane", proposedId: "bikeLaneProposed", label: "Existing Bike Lanes" },
      { existingId: "protectedBikeLane", proposedId: "protectedBikeLaneProposed", label: "Existing Protected Bike Lanes" },
    ],
  },
  {
    title: "FOOT PATHS",
    items: [
      { existingId: "pavedFootway", proposedId: "pavedFootwayProposed", label: "Paved Footway" },
      { existingId: "naturalSurfaceFootway", proposedId: "naturalSurfaceFootwayProposed", label: "Natural Surface Footway" },
    ],
  },
];

export const LANDLINE_SWATCH_COLOR = "#00A884";

export const getLayerColor = (layers, layerId) => {
  const layer = layers.find((l) => l.id === layerId);
  return layer?.paint?.["line-color"] || "#505150";
};

export const getExistingLayerIds = () =>
  TRAIL_LAYER_CATEGORIES.flatMap((cat) => cat.items.map((item) => item.existingId));

export const getProposedLayerIds = () =>
  TRAIL_LAYER_CATEGORIES.flatMap((cat) => cat.items.map((item) => item.proposedId));
