import React from "react";

const containerStyle = {
  minWidth: 200,
  maxWidth: 300,
  color: "#2774bd",
  fontSize: 12,
  wordWrap: "break-word",
  overflowWrap: "break-word",
};

const OpenSpacePopupContent = ({ properties }) => {
  const p = properties || {};

  return (
    <div style={containerStyle}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>OpenSpace</div>
      {p.SITE_NAME && <div style={{ marginBottom: 4, fontWeight: 500 }}>{p.SITE_NAME}</div>}
      {p.FEE_OWNER && <div style={{ marginBottom: 2 }}>Owner: {p.FEE_OWNER}</div>}
      {p.OWNER_TYPE && <div style={{ marginBottom: 2 }}>Owner Type: {p.OWNER_TYPE}</div>}
      {p.PRIM_PURP && <div style={{ marginBottom: 2 }}>Primary Purpose: {p.PRIM_PURP}</div>}
      {p.PUB_ACCESS && <div style={{ marginBottom: 2 }}>Public Access: {p.PUB_ACCESS}</div>}
      {p.GIS_ACRES !== null && p.GIS_ACRES !== undefined && (
        <div style={{ marginBottom: 2 }}>Acres: {parseFloat(p.GIS_ACRES).toFixed(2)}</div>
      )}
      {!p.SITE_NAME && !p.FEE_OWNER && <div>No data available</div>}
    </div>
  );
};

export default OpenSpacePopupContent;
