import React, { useContext, useState } from "react";
import { Popup } from "react-map-gl";
import Button from "react-bootstrap/Button";
import Carousel from "react-bootstrap/Carousel";
import editIcon from "../../assets/icons/edit-icon.svg";
import { ModalContext } from "../../App";
import muniKeys from "../../data/ma_muni_keys.json";

const Identify = ({ point, identifyResult, handleShowPopup, handleCarousel }) => {
  const { showEditModal, toggleEditModal } = useContext(ModalContext);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Function to get municipality name by muni_id
  const getMunicipalityName = (muniId) => {
    if (muniId == null || muniId === "" || muniId === "Null") return "";

    const municipality = muniKeys.find(
      (muni) => String(muni.muni_id) === String(muniId)
    );
    return municipality ? municipality.muni_name : "";
  };

  const getAttributeValue = (attributes, keys) => {
    for (const key of keys) {
      const value = attributes[key];
      if (value != null && value !== "" && value !== "Null" && value !== " ") {
        return value;
      }
    }
    return "";
  };

  const getTrailName = (attributes) =>
    getAttributeValue(attributes, ["local_name", "Local Name"]) ||
    getAttributeValue(attributes, ["reg_name", "Regional Name"]) ||
    getAttributeValue(attributes, ["prop_name", "Property Name"]);

  const getLengthFeet = (attributes) => {
    const raw = getAttributeValue(attributes, ["length_ft", "Facility Length in Feet"]);
    if (raw === "") return "";

    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : "";
  };

  const identifyLayer = [];
  const identifyAttributes = [];
  const identifyTrailName = [];
  const identifyMunicipality = [];
  const identifyDate = [];
  const identifyLength = [];

  identifyResult.forEach((element) => {
    identifyLayer.push(element.layerName);
    identifyAttributes.push(element.attributes);
    identifyTrailName.push(getTrailName(element.attributes));
    identifyMunicipality.push(
      getMunicipalityName(
        element.attributes["muni_id"] || element.attributes["Municipal ID"] || null
      ) ?? ""
    );
    identifyDate.push(
      getAttributeValue(element.attributes, ["open_date", "Facility Opening Date"])
    );
    identifyLength.push(getLengthFeet(element.attributes));
  });

  const carouselItems = [];
  for (let i = 0; i < identifyResult.length; i++) {
    carouselItems.push(
      <Carousel.Item key={i}>
        {(identifyTrailName[i] && <span className="Popup__name ">Name: {identifyTrailName[i]}</span>) ||
          (!identifyTrailName[i] && <span className="Popup__name">Name: N/A</span>)}
        {(identifyLayer[i] && (
          <span className="Popup__layer Popup__section">
            Type: {identifyLayer[i]}
          </span>
        )) ||
          (!identifyLayer[i] && <span className="Popup__layer Popup__section">Type: N/A</span>)}
        {(identifyMunicipality[i] && <span className="Popup__info Popup__section">Municipality: {identifyMunicipality[i]}</span>) ||
          (!identifyMunicipality[i] && <span className="Popup__info Popup__section">Municipality: N/A</span>)}
        {(identifyDate[i] && <span className="Popup__info Popup__section">Opening Date: {identifyDate[i]}</span>) ||
          (!identifyDate[i] && <span className="Popup__info Popup__section">Opening Date: N/A</span>)}
        {(identifyLength[i] && <span className="Popup__info Popup__section">Length: {identifyLength[i]} ft</span>) ||
           (!identifyLength[i] && <span className="Popup__info Popup__section">Length: N/A</span>)}
      </Carousel.Item>
    );
  }

  function handleSelect(event) {
    setCarouselIndex(event);
    handleCarousel(event);
  }

  return (
    <Popup
      longitude={point.lng}
      className="Popup"
      latitude={point.lat}
      anchor="bottom"
      onClose={() => handleShowPopup(false)}
    >
      <Carousel
        slide={false}
        data-bs-theme="dark"
        interval={null}
        controls={identifyResult.length > 1}
        activeIndex={carouselIndex}
        onSelect={handleSelect}
      >
        {carouselItems}
      </Carousel>
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
