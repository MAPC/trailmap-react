import React, { useState, useRef, useEffect, useContext } from "react";
import { ModalContext } from "../../App";
import { Popup } from "react-map-gl";
import Button from "react-bootstrap/Button";
import editIcon from "../../assets/icons/edit-icon.svg";

const Identify = ({ point, identifyResult, handleShowPopup }) => {
  const { showEditModal, toggleEditModal } = useContext(ModalContext);

  const identifyLayer = identifyResult.layerName;
  const identifyAttributes = identifyResult.attributes;
  const identifyTrailName =
    identifyAttributes["Regional Name"] !== "Null"
      ? identifyAttributes["Regional Name"]
      : identifyAttributes["Property Name"] !== "Null"
      ? identifyAttributes["Property Name"]
      : identifyAttributes["Local Name"] !== "Null"
      ? identifyAttributes["Local Name"]
      : "";
  const identifySteward =
    identifyAttributes["Steward"] !== "Null"
      ? identifyAttributes["Steward"]
      : identifyAttributes["Owner / Steward"] !== "Null"
      ? identifyAttributes["Owner / Steward"]
      : "";
  const identifyDate =
    identifyAttributes["Facility Opening Date"] !== "Null" ? identifyAttributes["Facility Opening Date"] : "";

  return (
    <Popup
      longitude={point.lng}
      className="Popup"
      latitude={point.lat}
      anchor="bottom"
      onClose={() => handleShowPopup(false)}
    >
      {identifyTrailName && <span className="Popup__name">{identifyTrailName}</span>}
      {identifyLayer && <span className="Popup__layer">{identifyLayer}</span>}
      {identifySteward && <span className="Popup__info">{identifySteward}</span>}
      {identifyDate && <span className="Popup__info">{identifyDate}</span>}

      <Button
        className="identify-contribute-btn"
        onClick={() => {
          toggleEditModal(true);
        }}
      >
        <img src={editIcon} alt={"Contribute Data"}></img>
      </Button>
    </Popup>
  );
};

export default Identify;
