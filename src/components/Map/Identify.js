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
    if (!muniId || muniId === "Null" || muniId === "") return "";
    
    // Handle both string and numeric muni_id
    const municipality = muniKeys.find(muni => 
      muni.muni_id === parseInt(muniId) || 
      muni.muni_id === muniId ||
      muni.muni_id.toString() === muniId.toString()
    );
    console.log("Looking for muni_id:", muniId, "Found:", municipality);
    return municipality ? municipality.muni_name : "";
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
    identifyTrailName.push(
      element.attributes["Local Name"] !== "Null" && element.attributes["Local Name"] !== " "
        ? element.attributes["Local Name"]
        : element.attributes["Regional Name"] !== "Null" && element.attributes["Regional Name"] !== " "
        ? element.attributes["Regional Name"]
        : element.attributes["Property Name"] !== "Null" && element.attributes["Property Name"] !== " "
        ? element.attributes["Property Name"]
        : ""
    );
    identifyMunicipality.push(
      getMunicipalityName(element.attributes["muni_id"] || element.attributes["Municipal ID"])
      
    );
    identifyDate.push(
      element.attributes["Facility Opening Date"] !== "Null" ? element.attributes["Facility Opening Date"] : ""
    );
    identifyLength.push(
      element.attributes["st_length(shape)"] !== "Null" ? element.attributes["st_length(shape)"] : ""
    );
    
  });

  const carouselItems = [];
  for (let i = 0; i < identifyResult.length; i++) {
    carouselItems.push(
      <Carousel.Item key={i}>
        {(identifyTrailName[i] && <span className="Popup__name ">Name: {identifyTrailName[i]}</span>) ||
          (!identifyTrailName[i] && <span className="Popup__name">Name: N/A</span>)}
        {(identifyLayer[i] && (
          <span className="Popup__layer Popup__section">
            Type:{" "}
            {identifyLayer[i].split(" ")[0] != "Existing"
              ? identifyLayer[i]
              : identifyLayer[i].split(" ").slice(1, identifyLayer[i].split(" ").length).join(" ")}
          </span>
        )) ||
          (!identifyLayer[i] && <span className="Popup__layer Popup__section">Type: N/A</span>)}
        {(identifyMunicipality[i] && <span className="Popup__info Popup__section">Municipality: {identifyMunicipality[i]}</span>) ||
          (!identifyMunicipality[i] && <span className="Popup__info Popup__section">Municipality: N/A</span>)}
        {(identifyDate[i] && <span className="Popup__info Popup__section">Opening Date: {identifyDate[i]}</span>) ||
          (!identifyDate[i] && <span className="Popup__info Popup__section">Opening Date: N/A</span>)}
         {(identifyLength[i] && <span className="Popup__info Popup__section">Length: {parseFloat(identifyLength[i]).toFixed(2)} (meters)</span>) ||
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
