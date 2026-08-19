/**
 * MassGIS OpenSpace primary purpose codes → display labels.
 * source: https://www.mass.gov/info-details/massgis-data-protected-and-recreational-openspace
 */
export const MASSGIS_OPEN_SPACE_URL =
  "https://www.mass.gov/info-details/massgis-data-protected-and-recreational-openspace";
export const openSpacePrimaryPurposeLabels = {
  R: "Recreation (activities are facility based)",
  C: "Conservation (activities are non-facility based)",
  B: "Recreation and Conservation",
  H: "Historical/Cultural",
  A: "Agriculture",
  W: "Water Supply Protection",
  S: "Scenic (official designation only)",
  F: "Flood Control",
  U: "Site is underwater",
  O: "Other (explain)",
  X: "Unknown",
};

/**
 * MassGIS OpenSpace ownership/interest type codes.
 * https://www.mass.gov/info-details/massgis-data-protected-and-recreational-openspace
 * Used by OWNER_TYPE, MANAGR_TYP, OLI_1_TYPE, OLI_2_TYPE, OLI_3_TYPE.
 */
export const openSpaceOwnerTypeLabels = {
  F: "Federal",
  S: "State",
  C: "County",
  M: "Municipal",
  N: "Private Nonprofit",
  P: "Private for profit",
  B: "Public Nonprofit",
  L: "Land Trust",
  G: "Conservation Organization",
  O: "Other / None of the above (e.g. joint ownership)",
  X: "Unknown",
  I: "Inholding (a piece of unprotected property surrounded on all sides by a protected property or a recreational facility)",
  // Unconfirmed codes
  1: "EOEEA or alternate state agencies",
  2: "EOEEA or non-profit",
  3: "EOEEA or municipality",
  4: "EOEEA or private landowner",
};

export const getOpenSpacePrimaryPurposeLabel = (code) => {
  if (code == null || code === "") return null;
  const key = String(code).trim().toUpperCase();
  return openSpacePrimaryPurposeLabels[key] || String(code);
};

export const getOpenSpaceOwnerTypeLabel = (code) => {
  if (code == null || code === "") return null;
  const raw = String(code).trim();
  const upper = raw.toUpperCase();
  return (
    openSpaceOwnerTypeLabels[upper] ||
    openSpaceOwnerTypeLabels[raw] ||
    raw
  );
};
