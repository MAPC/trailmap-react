import React from "react";
import { TRAIL_FACILITY_TYPE_LABELS } from "../constants/trailFacilityTypeLabels";
import { getMunicipalityName } from "../utils/municipalityUtils";

const containerStyle = {
  minWidth: 200,
  maxWidth: 300,
  color: "#2774bd",
  fontSize: 12,
  wordWrap: "break-word",
  overflowWrap: "break-word",
};

const getTrailTypeLabel = (segType, facStat) =>
  TRAIL_FACILITY_TYPE_LABELS[`${segType},${facStat}`] || null;

const getStatusLabel = (facStat) => {
  if (facStat === 1 || facStat === "1") return "Existing";
  if (facStat === 2 || facStat === "2") return "Design/Construction";
  return "Envisioned";
};

/**
 * Trail popup content for major trail and other regional trail clicks.
 */
const TrailPopupContent = ({ properties, titleKey = "reg_name" }) => {
  const p = properties || {};
  const segType = p.seg_type;
  const facStat = p.fac_stat;
  const trailTypeLabel = getTrailTypeLabel(segType, facStat);
  const muniId = p.muni_id || p.MUNI_ID || p.muniId;
  const municipalityName = muniId ? getMunicipalityName(muniId) : null;
  const title = p[titleKey];

  return (
    <div style={containerStyle}>
      {title && (
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14, color: "#2774bd" }}>{title}</div>
      )}
      {trailTypeLabel && (
        <div style={{ marginBottom: 4 }}><strong>Type:</strong> {trailTypeLabel}</div>
      )}
      {municipalityName && (
        <div style={{ marginBottom: 4 }}><strong>Municipality:</strong> {municipalityName}</div>
      )}
      {p.steward && (
        <div style={{ marginBottom: 4 }}><strong>Steward:</strong> {p.steward}</div>
      )}
      {p.website && (
        <div style={{ marginBottom: 4 }}>
          <strong>Website:</strong>{" "}
          <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: "#2774bd", wordBreak: "break-all" }}>
            {p.website.length > 40 ? `${p.website.substring(0, 40)}...` : p.website}
          </a>
        </div>
      )}
      {p.length_ft && (
        <div style={{ marginBottom: 4 }}>
          <strong>Length:</strong> {(parseFloat(p.length_ft) / 5280).toFixed(2)} miles
        </div>
      )}
      {p.fac_stat != null && (
        <div style={{ marginBottom: 4 }}><strong>Status:</strong> {getStatusLabel(p.fac_stat)}</div>
      )}
    </div>
  );
};

export default TrailPopupContent;
