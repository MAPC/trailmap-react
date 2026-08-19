import muniKeys from "../../../data/ma_muni_keys.json";

const isMissingMuniId = (muniId) =>
  muniId == null || muniId === "Null" || muniId === "" || muniId === 0;

export const getMunicipalityRecord = (muniId) => {
  if (isMissingMuniId(muniId)) return null;
  return (
    muniKeys.find(
      (muni) =>
        muni.muni_id === parseInt(muniId, 10) ||
        muni.muni_id === muniId ||
        muni.muni_id.toString() === muniId.toString()
    ) || null
  );
};

/**
 * Get municipality name from muni_id
 * @param {string|number} muniId - Municipality ID
 * @returns {string|null} Municipality name or null if not found/invalid
 */
export const getMunicipalityName = (muniId) => {
  const municipality = getMunicipalityRecord(muniId);
  return municipality ? municipality.muni_name : null;
};

export const formatTownDisplayName = (town) => {
  if (!town) return "";
  return String(town)
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
