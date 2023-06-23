import React from "react";
import { Popup } from "react-map-gl";
import Carousel from "react-bootstrap/Carousel";

const Identify = ({ point, identifyResult, handleShowPopup }) => {
  const identifyLayer = [];
  const identifyAttributes = [];
  const identifyTrailName = [];
  const identifySteward = [];
  const identifyDate = [];

  identifyResult.forEach((element) => {
    identifyLayer.push(element.layerName);
    identifyAttributes.push(element.attributes);
    identifyTrailName.push(
      element.attributes["Regional Name"] !== "Null" && element.attributes["Regional Name"] !== " "
        ? element.attributes["Regional Name"]
        : element.attributes["Property Name"] !== "Null" && element.attributes["Property Name"] !== " "
        ? element.attributes["Property Name"]
        : element.attributes["Local Name"] !== "Null" && element.attributes["Local Name"] !== " "
        ? element.attributes["Local Name"]
        : ""
    );
    identifySteward.push(
      element.attributes["Steward"] !== "Null"
        ? element.attributes["Steward"]
        : element.attributes["Owner / Steward"] !== "Null"
        ? element.attributes["Owner / Steward"]
        : ""
    );
    identifyDate.push(
      element.attributes["Facility Opening Date"] !== "Null" ? element.attributes["Facility Opening Date"] : ""
    );
  });

  const carouselItems = [];
  for (let i = 0; i < identifyResult.length; i++) {
    carouselItems.push(
      <Carousel.Item key={i}>
        {(identifyTrailName[i] && <span className="Popup__name ">Name: {identifyTrailName[i]}</span>) ||
          (!identifyTrailName[i] && <span className="Popup__name">Name: N/A</span>)}
        {(identifyLayer[i] && <span className="Popup__layer Popup__section">Type: {identifyLayer[i]}</span>) ||
          (!identifyLayer[i] && <span className="Popup__layer Popup__section">Type: N/A</span>)}
        {(identifySteward[i] && <span className="Popup__info Popup__section">Steward: {identifySteward[i]}</span>) ||
          (!identifySteward[i] && <span className="Popup__info Popup__section">Steward: N/A</span>)}
        {(identifyDate[i] && <span className="Popup__info Popup__section">ID Date: {identifyDate[i]}</span>) ||
          (!identifyDate[i] && <span className="Popup__info Popup__section">ID Date: N/A</span>)}
      </Carousel.Item>
    );
  }

  return (
    <Popup
      longitude={point.lng}
      className="Popup"
      latitude={point.lat}
      anchor="bottom"
      onClose={() => handleShowPopup(false)}
    >
      <Carousel slide={false} data-bs-theme="dark" interval={null}>
        {carouselItems}
      </Carousel>
    </Popup>
  );
};

export default Identify;
