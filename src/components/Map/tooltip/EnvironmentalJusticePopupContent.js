import React from "react";

const containerStyle = {
  minWidth: 200,
  maxWidth: 300,
  color: "#2774bd",
  fontSize: 12,
  wordWrap: "break-word",
  overflowWrap: "break-word",
};

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
    <div style={containerStyle}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Environmental Justice</div>
      {area && <div style={{ marginBottom: 4 }}><strong>Area:</strong> {area}</div>}
      {municipality && <div style={{ marginBottom: 4 }}><strong>Municipality:</strong> {municipality}</div>}
      {ejCritDesc && <div style={{ marginBottom: 4 }}><strong>EJ Criteria:</strong> {ejCritDesc}</div>}
      {ej && <div style={{ marginBottom: 4 }}><strong>EJ Designated:</strong> {ej}</div>}
      {totalPop !== undefined && totalPop !== null && (
        <div style={{ marginBottom: 4 }}><strong>Total Population:</strong> {parseFloat(totalPop).toLocaleString()}</div>
      )}
      {pctMinority !== undefined && pctMinority !== null && (
        <div style={{ marginBottom: 4 }}><strong>Percent Minority:</strong> {parseFloat(pctMinority).toFixed(1)}%</div>
      )}
      {limEnghHPct !== undefined && limEnghHPct !== null && (
        <div style={{ marginBottom: 4 }}><strong>Limited English Households:</strong> {parseFloat(limEnghHPct).toFixed(1)}%</div>
      )}
      {bgMhhi !== undefined && bgMhhi !== null && (
        <div style={{ marginBottom: 4 }}><strong>Median Household Income:</strong> ${parseFloat(bgMhhi).toLocaleString()}</div>
      )}
      {geoid && (
        <div style={{ marginBottom: 4, fontSize: 11, color: "#666" }}><strong>GEOID:</strong> {geoid}</div>
      )}
      {!hasData && <div>No data available</div>}
    </div>
  );
};

export default EnvironmentalJusticePopupContent;
