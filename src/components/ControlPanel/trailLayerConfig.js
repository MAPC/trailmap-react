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

const getLandlineSymbol = (layer) => {
  const filter = layer?.filter;
  if (
    Array.isArray(filter) &&
    filter[0] === "==" &&
    filter[1] === "_symbol" &&
    filter[2] != null
  ) {
    return filter[2];
  }
  return null;
};

const getLandlineLabel = (layerId = "") =>
  String(layerId)
    .replace(/^Facility Type\//, "")
    .replace(/\/\d+$/, "");

const isWhiteColor = (color) => String(color || "").toUpperCase() === "#FFFFFF";

const toSvgDasharray = (dashArray, width = 3) =>
  Array.isArray(dashArray)
    ? dashArray.map((value) => Math.max(1, value * width)).join(" ")
    : null;

/**
 * Build LandLine legend entries from the same LayerData paints drawn on the map.
 * Keeps casing/dash/offset so the swatch matches the map symbol, not a simplified color chip.
 */
export const getLandlineLegendItems = (landlineLayers = []) => {
  const bySymbol = new Map();

  landlineLayers.forEach((layer) => {
    const symbol = getLandlineSymbol(layer);
    if (symbol == null) return;

    const paint = layer.paint || {};
    const color = paint["line-color"];
    if (!color) return;

    const entry = bySymbol.get(symbol) || {
      key: `landline-${symbol}`,
      label: getLandlineLabel(layer.id),
      strokes: [],
    };

    entry.strokes.push({
      color,
      width: Number(paint["line-width"]) || 3,
      dashArray: paint["line-dasharray"] || null,
      offset: paint["line-offset"],
    });

    if (!isWhiteColor(color)) {
      entry.label = getLandlineLabel(layer.id);
    }

    bySymbol.set(symbol, entry);
  });

  return Array.from(bySymbol.values()).map((entry) => {
    const whiteStrokes = entry.strokes.filter((stroke) => isWhiteColor(stroke.color));
    const coloredStrokes = entry.strokes.filter((stroke) => !isWhiteColor(stroke.color));
    const offsetCount = entry.strokes.filter((stroke) => stroke.offset != null).length;
    const doubleLine = offsetCount >= 2;
    const hasCasing = !doubleLine && whiteStrokes.length > 0 && coloredStrokes.length > 0;

    const normalize = (stroke) => ({
      ...stroke,
      dasharray: toSvgDasharray(stroke.dashArray, stroke.width || 3),
    });

    const primaryColored = coloredStrokes[coloredStrokes.length - 1] || entry.strokes[entry.strokes.length - 1];
    const dashed = entry.strokes.some((stroke) => Array.isArray(stroke.dashArray));

    let previewStrokes;
    if (doubleLine) {
      previewStrokes = (coloredStrokes.length ? coloredStrokes : entry.strokes)
        .filter((stroke) => stroke.offset != null)
        .map(normalize);
      if (!previewStrokes.length) {
        previewStrokes = [normalize(primaryColored)];
      }
    } else if (hasCasing) {
      const fill = primaryColored;
      const fillWidth = 5;
      const dashedCasing = whiteStrokes.find((stroke) =>
        Array.isArray(stroke.dashArray)
      );
      const solidCasing = whiteStrokes.find(
        (stroke) => !Array.isArray(stroke.dashArray)
      );

      if (dashedCasing) {
        // Design-style: solid color at the bottom, thinner dashed dots on top.
        const casingWidth = 1.6;
        const casingDash = toSvgDasharray(
          dashedCasing.dashArray || [1.47, 1.47],
          1.1
        );
        previewStrokes = [
          {
            ...normalize(fill),
            role: "fill",
            dasharray: null,
            width: fillWidth,
          },
          {
            ...normalize(dashedCasing),
            role: "casing-underlay",
            color: "#B8B8B8",
            width: casingWidth + 0.5,
            dasharray: casingDash,
          },
          {
            ...normalize(dashedCasing),
            role: "casing",
            color: "#FFFFFF",
            width: casingWidth,
            dasharray: casingDash,
          },
        ];
      } else {
        // Existing casing-style (e.g. Protected Bike Lane and Sidewalk):
        // blue/color outer line with a thinner solid white inner line.
        const casing = solidCasing || whiteStrokes[whiteStrokes.length - 1];
        const innerWidth = 1.5;
        previewStrokes = [
          {
            ...normalize(fill),
            role: "fill",
            dasharray: null,
            width: fillWidth,
          },
          {
            ...normalize(casing),
            role: "inner-underlay",
            color: "#C8C8C8",
            dasharray: null,
            width: innerWidth + 0.5,
          },
          {
            ...normalize(casing),
            role: "inner",
            color: "#FFFFFF",
            dasharray: null,
            width: innerWidth,
          },
        ];
      }
    } else {
      const primary = normalize(primaryColored);
      previewStrokes = [
        {
          ...primary,
          dasharray: dashed ? primary.dasharray || "7 5" : null,
        },
      ];
    }

    return {
      key: entry.key,
      label: entry.label,
      color: primaryColored?.color || "#666666",
      dashed,
      doubleLine,
      hasCasing,
      previewStrokes,
    };
  });
};

export const getLayerColor = (layers, layerId) => {
  const layer = layers.find((l) => l.id === layerId);
  return layer?.paint?.["line-color"] || "#505150";
};

export const getExistingLayerIds = () =>
  TRAIL_LAYER_CATEGORIES.flatMap((cat) => cat.items.map((item) => item.existingId));

export const getProposedLayerIds = () =>
  TRAIL_LAYER_CATEGORIES.flatMap((cat) => cat.items.map((item) => item.proposedId));
