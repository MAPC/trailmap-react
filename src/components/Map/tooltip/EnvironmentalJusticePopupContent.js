import React from "react";
import styled from "styled-components";

const EJPopupContainer = styled.div`
  min-width: 200px;
  max-width: 300px;
  color: #2774bd;
  font-size: 12px;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const EJPopupTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const EJPopupRow = styled.div`
  margin-bottom: 4px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-size: ${(props) => (props.$muted ? "11px" : "inherit")};
  color: ${(props) => (props.$muted ? "#666" : "inherit")};
`;

// Supports both UPPER_SNAKE_CASE (RegionalTrailsProfile) and PascalCase (CommunityTrailsProfile) property names
const EnvironmentalJusticePopupContent = ({ properties }) => {
  const p = properties || {};
  const area = p.GEOGRAPHICAREANAME || p.Geographic_Area_Name;
  const municipality = p.MUNICIPALITY || p.Municipality;
  const ejCritDesc = p.EJ_CRIT_DESC || p.EJ_Crit_Desc;
  const ej = p.EJ || p.Ej;
  const totalPop = p.TOTAL_POP;
  const pctMinority = p.PCT_MINORITY;
  const limEnghHPct = p.LIMENGHHPCT;
  const bgMhhi = p.BG_MHHI;
  const geoid = p.GEOID;
  const hasData = area || municipality || ejCritDesc;

  return (
    <EJPopupContainer>
      <EJPopupTitle>Environmental Justice</EJPopupTitle>
      {area && (
        <EJPopupRow><strong>Area:</strong> {area}</EJPopupRow>
      )}
      {municipality && (
        <EJPopupRow><strong>Municipality:</strong> {municipality}</EJPopupRow>
      )}
      {ejCritDesc && (
        <EJPopupRow><strong>EJ Criteria:</strong> {ejCritDesc}</EJPopupRow>
      )}
      {ej && (
        <EJPopupRow><strong>EJ Designated:</strong> {ej}</EJPopupRow>
      )}
      {totalPop !== undefined && totalPop !== null && (
        <EJPopupRow><strong>Total Population:</strong> {parseFloat(totalPop).toLocaleString()}</EJPopupRow>
      )}
      {pctMinority !== undefined && pctMinority !== null && (
        <EJPopupRow><strong>Percent Minority:</strong> {parseFloat(pctMinority).toFixed(1)}%</EJPopupRow>
      )}
      {limEnghHPct !== undefined && limEnghHPct !== null && (
        <EJPopupRow><strong>Limited English Households:</strong> {parseFloat(limEnghHPct).toFixed(1)}%</EJPopupRow>
      )}
      {bgMhhi !== undefined && bgMhhi !== null && (
        <EJPopupRow><strong>Median Household Income:</strong> ${parseFloat(bgMhhi).toLocaleString()}</EJPopupRow>
      )}
      {geoid && (
        <EJPopupRow $muted><strong>GEOID:</strong> {geoid}</EJPopupRow>
      )}
      {!hasData && <EJPopupRow>No data available</EJPopupRow>}
    </EJPopupContainer>
  );
};

export default EnvironmentalJusticePopupContent;
