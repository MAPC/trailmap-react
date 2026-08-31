import React from "react";
import {
  formatTownDisplayName,
  getMunicipalityRecord,
} from "../utils/municipalityUtils";

const MunicipalityPopupContent = ({ properties }) => {
  const p = properties || {};
  const record = getMunicipalityRecord(p.town_id);
  const name =
    record?.muni_name ||
    formatTownDisplayName(p.town || p.NAME) ||
    "Unknown municipality";

  return <div className="MunicipalityPopup">{name}</div>;
};

export default MunicipalityPopupContent;
