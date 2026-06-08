export const TRAIL_LAYER_CATEGORIES = [
  {
    title: "SHARED-USE PATHS",
    items: [
      { existingId: "pavedPaths", proposedId: "pavedPathsProposed", label: "Paved Shared Use" },
      { existingId: "unimprovedPaths", proposedId: "unimprovedPathsProposed", label: "Unimproved Shared Use" },
    ],
  },
  {
    title: "BIKE FACILITIES",
    items: [
      { existingId: "bikeLane", proposedId: "bikeLaneProposed", label: "Bike Lanes" },
      { existingId: "protectedBikeLane", proposedId: "protectedBikeLaneProposed", label: "Protected Bike Lanes" },
    ],
  },
  {
    title: "FOOT PATHS",
    items: [
      { existingId: "pavedFootway", proposedId: "pavedFootwayProposed", label: "Paved Foot Path" },
      { existingId: "naturalSurfaceFootway", proposedId: "naturalSurfaceFootwayProposed", label: "Natural Surface Path" },
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
