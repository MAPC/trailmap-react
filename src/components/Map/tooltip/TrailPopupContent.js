import React from "react";
import styled from "styled-components";
import { TRAIL_FACILITY_TYPE_LABELS } from "../constants/mapConstants";
import { getMunicipalityName } from "../utils/municipalityUtils";

const TrailPopupContainer = styled.div`
  min-width: 200px;
  max-width: 300px;
  color: #2774bd;
  font-size: 12px;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const TrailPopupTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
  color: #2774bd;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const TrailPopupRow = styled.div`
  margin-bottom: 4px;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const TrailPopupLink = styled.a`
  color: #2774bd;
  word-break: break-all;
`;

const getTrailTypeLabel = (segType, facStat) =>
  TRAIL_FACILITY_TYPE_LABELS[`${segType},${facStat}`] || null;

const getStatusLabel = (facStat) => {
  if (facStat === 1 || facStat === "1") return "Existing";
  if (facStat === 2 || facStat === "2") return "Design/Construction";
  return "Envisioned";
};

/**
 * Reusable trail popup content for Major Trail and Regular Trail click popups.
 * @param {object} props
 * @param {object} props.properties - Feature properties from the clicked trail
 * @param {'grouped_reg_name'|'reg_name'} props.titleKey - Key for the trail name (grouped_reg_name for major trails, reg_name for regular)
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
    <TrailPopupContainer>
      {title && <TrailPopupTitle>{title}</TrailPopupTitle>}
      {trailTypeLabel && (
        <TrailPopupRow><strong>Type:</strong> {trailTypeLabel}</TrailPopupRow>
      )}
      {municipalityName && (
        <TrailPopupRow><strong>Municipality:</strong> {municipalityName}</TrailPopupRow>
      )}
      {p.steward && (
        <TrailPopupRow><strong>Steward:</strong> {p.steward}</TrailPopupRow>
      )}
      {p.website && (
        <TrailPopupRow>
          <strong>Website:</strong>{" "}
          <TrailPopupLink href={p.website} target="_blank" rel="noopener noreferrer">
            {p.website.length > 40 ? p.website.substring(0, 40) + "..." : p.website}
          </TrailPopupLink>
        </TrailPopupRow>
      )}
      {p.length_ft && (
        <TrailPopupRow>
          <strong>Length:</strong> {(parseFloat(p.length_ft) / 5280).toFixed(2)} miles
        </TrailPopupRow>
      )}
      {p.fac_stat != null && (
        <TrailPopupRow><strong>Status:</strong> {getStatusLabel(p.fac_stat)}</TrailPopupRow>
      )}
    </TrailPopupContainer>
  );
};

export default TrailPopupContent;
