/**
 * LandLine colors and status styling, matching the MAPC embedded map:
 * https://github.com/MAPC/embedded-map
 *
 * Type = color. Status = solid (existing), white dashed overlay (design /
 * construction), or dashed (envisioned).
 */
export const LANDLINE_FEATURE_COLORS = {
  sharedUse: "#00a884",
  sharedUseUnimproved: "#c7d79e",
  protectedBikeLane: "#0170ff",
  bikeLane: "#73b2ff",
  sharedStreet: "#d7c29e",
  gap: "#ffffcc",
  gapOutline: "#adb5bd",
  footTrail: "#ffcccc",
  designOverlay: "#ffffff",
};

export const LANDLINE_SWATCH_COLOR = LANDLINE_FEATURE_COLORS.sharedUse;
export const LANDLINE_CASING_COLOR = LANDLINE_FEATURE_COLORS.gapOutline;

/** Click selection halo (matches the embedded LandLine map). */
export const LANDLINE_SELECTION_HIGHLIGHT = {
  color: "#00ffff",
  width: 14,
};

/** All seg_type,fac_stat keys the FeatureServer renderer uses. */
export const LANDLINE_SEG_FAC_KEYS = [
  "1,1",
  "1,2",
  "1,3",
  "2,1",
  "2,2",
  "2,3",
  "3,1",
  "3,2",
  "3,3",
  "4,1",
  "4,3",
  "5,1",
  "5,3",
  "6,1",
  "6,2",
  "6,3",
  "9,1",
  "9,2",
  "9,3",
  "11,1",
  "11,2",
  "11,3",
  "12,1",
  "12,2",
  "12,3",
];

export const getLandlineRenderedLayerIds = () =>
  LANDLINE_SEG_FAC_KEYS.flatMap((key) => [
    `landlines-layer-${key}-outline`,
    `landlines-layer-${key}-overlay`,
  ]);

const BASE_WIDTH = 4;

const dashed = (width) => [Math.max(1, width * 0.5), Math.max(1.5, width * 1.25)];

/**
 * Returns outline + optional overlay paints for a LandLine segment.
 * seg_type / fac_stat come from the landlines FeatureServer.
 */
export const getLandlineLineStyle = (segType, facStat) => {
  const st = Number(segType);
  const fs = Number(facStat);
  let color = LANDLINE_FEATURE_COLORS.sharedUse;
  let width = BASE_WIDTH;
  let dashArray = null;
  let overlay = null;

  if (st === 1) {
    color = LANDLINE_FEATURE_COLORS.sharedUse;
    if (fs === 1 || fs === 2) width = BASE_WIDTH * 1.5;
    if (fs === 3) dashArray = dashed(width);
    if (fs === 2) {
      overlay = {
        color: LANDLINE_FEATURE_COLORS.designOverlay,
        width: width * 0.45,
        dashArray: dashed(width * 0.45),
      };
    }
  } else if (st === 6) {
    color = LANDLINE_FEATURE_COLORS.sharedUse;
    width = BASE_WIDTH + 2;
    overlay = {
      color: LANDLINE_FEATURE_COLORS.sharedUseUnimproved,
      width: BASE_WIDTH,
      dashArray: fs === 3 ? dashed(BASE_WIDTH) : null,
    };
  } else if (st === 2) {
    color = LANDLINE_FEATURE_COLORS.protectedBikeLane;
    width = BASE_WIDTH * 1.5;
    if (fs === 2 || fs === 3) {
      overlay = {
        color: LANDLINE_FEATURE_COLORS.designOverlay,
        width: width * 0.45,
        dashArray: dashed(width * 0.45),
      };
    }
  } else if (st === 3) {
    color = LANDLINE_FEATURE_COLORS.bikeLane;
    if (fs === 2 || fs === 3) {
      overlay = {
        color: LANDLINE_FEATURE_COLORS.designOverlay,
        width: width * 0.45,
        dashArray: dashed(width * 0.45),
      };
    }
  } else if (st === 4 || st === 5) {
    color = LANDLINE_FEATURE_COLORS.sharedStreet;
    width = BASE_WIDTH * 1.5;
    if (st === 5 && fs === 3) dashArray = dashed(width);
  } else if (st === 9) {
    color = LANDLINE_FEATURE_COLORS.gapOutline;
    width = BASE_WIDTH + 2;
    overlay = {
      color: LANDLINE_FEATURE_COLORS.gap,
      width: BASE_WIDTH,
      dashArray: null,
    };
  } else if (st === 11 || st === 12) {
    color = LANDLINE_FEATURE_COLORS.footTrail;
    width = BASE_WIDTH * 0.5;
    if (fs === 2 || fs === 3) dashArray = dashed(width);
  }

  return {
    outline: { color, width, dashArray },
    overlay,
  };
};
