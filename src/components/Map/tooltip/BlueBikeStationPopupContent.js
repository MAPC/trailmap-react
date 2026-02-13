import React from "react";
import styled from "styled-components";

const BlueBikePopupContainer = styled.div`
  min-width: 200px;
  color: #2774bd;
  font-size: 12px;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const BlueBikePopupTitle = styled.div`
  font-weight: 600;
  margin-bottom: 6px;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const BlueBikePopupName = styled.div`
  margin-bottom: 4px;
  font-weight: 500;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const BlueBikePopupRow = styled.div`
  margin-bottom: 2px;
  font-size: 11px;
  color: #666;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const BlueBikeStationPopupContent = ({ properties }) => {
  const p = properties || {};
  const stationName = p.Name || p.name || "Unknown Station";
  const district = p.District || p.district || null;
  const totalDocks = p.Total_docks ?? p.total_docks ?? null;
  const number = p.Number || p.number || null;
  const isPublic =
    p.Public_ === "Yes" || p.public === "Yes"
      ? "Yes"
      : p.Public_ === "No" || p.public === "No"
      ? "No"
      : null;

  return (
    <BlueBikePopupContainer>
      <BlueBikePopupTitle>Blue Bike Station</BlueBikePopupTitle>
      <BlueBikePopupName>{stationName}</BlueBikePopupName>
      {district && <BlueBikePopupRow>District: {district}</BlueBikePopupRow>}
      {totalDocks != null && (
        <BlueBikePopupRow>Total Docks: {totalDocks}</BlueBikePopupRow>
      )}
      {number && <BlueBikePopupRow>Station #: {number}</BlueBikePopupRow>}
      {isPublic != null && <BlueBikePopupRow>Public: {isPublic}</BlueBikePopupRow>}
    </BlueBikePopupContainer>
  );
};

export default BlueBikeStationPopupContent;
