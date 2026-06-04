import muniKeys from "../../../data/ma_muni_keys.json";

/**
 * Get municipality name from muni_id
 * @param {string|number} muniId - Municipality ID
 * @returns {string|null} Municipality name or null if not found/invalid
 */
export const getMunicipalityName = (muniId) => {
  if (!muniId || muniId === "Null" || muniId === "" || muniId === 0) return null;
  const municipality = muniKeys.find(
    (muni) =>
      muni.muni_id === parseInt(muniId) ||
      muni.muni_id === muniId ||
      muni.muni_id.toString() === muniId.toString()
  );
  return municipality ? municipality.muni_name : null;
};
