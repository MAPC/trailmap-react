import React from "react";
import styled from "styled-components";

const OpenSpacePopupContainer = styled.div`
  min-width: 200px;
  max-width: 300px;
  color: #2774bd;
  font-size: 12px;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const OpenSpacePopupTitle = styled.div`
  font-weight: 600;
  margin-bottom: 6px;
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const OpenSpacePopupRow = styled.div`
  margin-bottom: ${(props) => (props.$spacing === "sm" ? "2px" : "4px")};
  font-weight: ${(props) => (props.$bold ? 500 : "inherit")};
  word-wrap: break-word;
  overflow-wrap: break-word;
`;

const OpenSpacePopupContent = ({ properties }) => {
  const p = properties || {};

  return (
    <OpenSpacePopupContainer>
      <OpenSpacePopupTitle>OpenSpace</OpenSpacePopupTitle>
      {p.SITE_NAME && (
        <OpenSpacePopupRow $bold>{p.SITE_NAME}</OpenSpacePopupRow>
      )}
      {p.FEE_OWNER && (
        <OpenSpacePopupRow $spacing="sm">Owner: {p.FEE_OWNER}</OpenSpacePopupRow>
      )}
      {p.OWNER_TYPE && (
        <OpenSpacePopupRow $spacing="sm">Owner Type: {p.OWNER_TYPE}</OpenSpacePopupRow>
      )}
      {p.PRIM_PURP && (
        <OpenSpacePopupRow $spacing="sm">Primary Purpose: {p.PRIM_PURP}</OpenSpacePopupRow>
      )}
      {p.PUB_ACCESS && (
        <OpenSpacePopupRow $spacing="sm">Public Access: {p.PUB_ACCESS}</OpenSpacePopupRow>
      )}
      {p.GIS_ACRES !== null && p.GIS_ACRES !== undefined && (
        <OpenSpacePopupRow $spacing="sm">Acres: {parseFloat(p.GIS_ACRES).toFixed(2)}</OpenSpacePopupRow>
      )}
      {!p.SITE_NAME && !p.FEE_OWNER && (
        <OpenSpacePopupRow>No data available</OpenSpacePopupRow>
      )}
    </OpenSpacePopupContainer>
  );
};

export default OpenSpacePopupContent;
