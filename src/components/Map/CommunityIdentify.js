import React, { useContext, useState } from "react";
import { Popup } from "react-map-gl";
import Button from "react-bootstrap/Button";
import Carousel from "react-bootstrap/Carousel";
import editIcon from "../../assets/icons/edit-icon.svg";
import { ModalContext } from "../../App";
import muniKeys from "../../data/ma_muni_keys.json";

// Identify popup variant for Community Trails Profile:
// trail name logic matches TrailListWindow: local_name -> reg_name -> prop_name,
// treating "", "Null", " ", and "0" as missing.
const CommunityIdentify = ({ point, identifyResult, handleShowPopup, handleCarousel }) => {
  const { toggleEditModal } = useContext(ModalContext);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const getMunicipalityName = (muniId) => {
    if (!muniId || muniId === "Null" || muniId === "") return "";
    const municipality = muniKeys.find(
      (muni) =>
        muni.muni_id === parseInt(muniId) ||
        muni.muni_id === muniId ||
        muni.muni_id.toString() === muniId.toString()
    );
    return municipality ? municipality.muni_name : "";
  };

  const normalizeCandidate = (value) => {
    const v = (value ?? "").toString().trim();
    const lowered = v.toLowerCase();
    // Treat common null-ish values as missing
    if (
      v === "" ||
      v === "0" ||
      lowered === "null" ||
      lowered === "<null>" ||
      lowered === "(null)" ||
      lowered === "n/a"
    ) {
      return "";
    }
    return v;
  };

  const identifyLayer = [];
  const identifyTrailName = [];
  const identifyMunicipality = [];
  const identifyDate = [];
  const identifyLength = [];

  identifyResult.forEach((element) => {
    identifyLayer.push(element.layerName);

    const attrs = element.attributes || {};
    const localName = normalizeCandidate(attrs["local_name"]);
    const regionalName = normalizeCandidate(attrs["reg_name"]);
    const propertyName = normalizeCandidate(attrs["prop_name"]);
    identifyTrailName.push(localName || regionalName || propertyName || "");

    identifyMunicipality.push(getMunicipalityName(attrs["muni_id"]));
    identifyDate.push(attrs["open_date"] !== "Null" ? attrs["open_date"] : "");

    const rawLengthFeet = attrs["length_ft"];
    const normalizedLengthFeet =
      rawLengthFeet !== undefined && rawLengthFeet !== null && rawLengthFeet !== "Null" && rawLengthFeet !== " "
        ? rawLengthFeet
        : "";
    identifyLength.push(normalizedLengthFeet);
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
            {identifyLayer[i].split(" ")[0] !== "Existing"
              ? identifyLayer[i]
              : identifyLayer[i].split(" ").slice(1, identifyLayer[i].split(" ").length).join(" ")}
          </span>
        )) ||
          (!identifyLayer[i] && <span className="Popup__layer Popup__section">Type: N/A</span>)}
        {(identifyMunicipality[i] && (
          <span className="Popup__info Popup__section">Municipality: {identifyMunicipality[i]}</span>
        )) ||
          (!identifyMunicipality[i] && <span className="Popup__info Popup__section">Municipality: N/A</span>)}
        {(identifyDate[i] && <span className="Popup__info Popup__section">Opening Date: {identifyDate[i]}</span>) ||
          (!identifyDate[i] && <span className="Popup__info Popup__section">Opening Date: N/A</span>)}
        {(identifyLength[i] && (
          <span className="Popup__info Popup__section">Length: {parseFloat(identifyLength[i]).toFixed(2)} ft</span>
        )) || (!identifyLength[i] && <span className="Popup__info Popup__section">Length: N/A</span>)}
      </Carousel.Item>
    );
  }

  function handleSelect(event) {
    setCarouselIndex(event);
    handleCarousel(event);
  }

  return (
    <Popup longitude={point.lng} className="Popup" latitude={point.lat} anchor="bottom" onClose={() => handleShowPopup(false)}>
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

export default CommunityIdentify;


