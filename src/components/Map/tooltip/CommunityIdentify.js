import React, { useContext, useState } from "react";
import { Popup } from "react-map-gl";
import Button from "react-bootstrap/Button";
import Carousel from "react-bootstrap/Carousel";
import editIcon from "../../../assets/icons/edit-icon.svg";
import { ModalContext } from "../../../App";
import { getMunicipalityName } from "../utils/municipalityUtils";

// Identify popup variant for Community Trails Profile:
// trail name logic matches TrailListWindow: local_name -> reg_name -> prop_name,
// treating "", "Null", " ", and "0" as missing.
const CommunityIdentify = ({ point, identifyResult, handleShowPopup, handleCarousel }) => {
  const { toggleEditModal } = useContext(ModalContext);
  const [carouselIndex, setCarouselIndex] = useState(0);

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

  // Check if result is a trail (same as original trails filter)
  const isTrailResult = (element) => typeof element.layerId === 'number';

  const identifyLayer = [];
  const identifyTrailName = [];
  const identifyMunicipality = [];
  const identifyDate = [];
  const identifyLength = [];

  identifyResult.forEach((element) => {
    identifyLayer.push(element.layerName);

    const attrs = element.attributes || {};
    
    // Handle different layer types
    let name = "";
    if (element.layerId === 'transit-land-stop' || element.layerName === 'Transit Stop') {
      // For transit stops, use Stop Name
      name = normalizeCandidate(attrs["Stop Name"] || attrs["stop_name"] || attrs["name"]);
    } else if (element.layerId === 'subway-station' || element.layerName === 'T-stop' || element.layerName === 'MBTA Subway Station') {
      // For subway stations, use name field
      name = normalizeCandidate(attrs["name"]);
    } else if (element.layerId === 'blue-bike-station' || element.layerName === 'Blue Bike Station') {
      // For blue bike stations, use name field
      name = normalizeCandidate(attrs["name"]);
    } else if (element.layerId === 'municipality' || element.layerName === 'Municipality') {
      // For municipalities, use name field
      name = normalizeCandidate(attrs["name"] || attrs["town"] || attrs["NAME"]);
    } else if (isTrailResult(element)) {
      // For trails: same as Identify.js - Local Name -> Regional Name -> Property Name (or snake_case equivalents)
      const localName = normalizeCandidate(attrs["Local Name"] || attrs["local_name"]);
      const regionalName = normalizeCandidate(attrs["Regional Name"] || attrs["reg_name"]);
      const propertyName = normalizeCandidate(attrs["Property Name"] || attrs["prop_name"]);
      name = localName || regionalName || propertyName || "";
    } else {
      // For other layers (OpenSpace etc), use standard trail name logic or name field
      const localName = normalizeCandidate(attrs["local_name"]);
      const regionalName = normalizeCandidate(attrs["reg_name"]);
      const propertyName = normalizeCandidate(attrs["prop_name"]);
      name = localName || regionalName || propertyName || normalizeCandidate(attrs["name"] || attrs["SITE_NAME"]) || "";
    }
    
    identifyTrailName.push(name);

    identifyMunicipality.push(getMunicipalityName(attrs["muni_id"] || attrs["Municipal ID"]) ?? "");
    identifyDate.push(
      (attrs["Facility Opening Date"] !== undefined && attrs["Facility Opening Date"] !== "Null")
        ? attrs["Facility Opening Date"]
        : (attrs["open_date"] !== undefined && attrs["open_date"] !== "Null") ? attrs["open_date"] : ""
    );

    const rawLengthFeet = attrs["Facility Length in Feet"] ?? attrs["length_ft"];
    const normalizedLengthFeet =
      rawLengthFeet !== undefined && rawLengthFeet !== null && rawLengthFeet !== "Null" && rawLengthFeet !== " "
        ? rawLengthFeet
        : "";
    identifyLength.push(normalizedLengthFeet);
  });

  const carouselItems = [];
  for (let i = 0; i < identifyResult.length; i++) {
    const element = identifyResult[i];
    const itemIsTrail = isTrailResult(element);
    const attrs = element.attributes || {};
    
    if (itemIsTrail) {
      // For trails: use same format as original trails filter (Identify.js)
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
          {(identifyMunicipality[i] && <span className="Popup__info Popup__section">Municipality: {identifyMunicipality[i]}</span>) ||
            (!identifyMunicipality[i] && <span className="Popup__info Popup__section">Municipality: N/A</span>)}
          {(identifyDate[i] && <span className="Popup__info Popup__section">Opening Date: {identifyDate[i]}</span>) ||
            (!identifyDate[i] && <span className="Popup__info Popup__section">Opening Date: N/A</span>)}
          {(identifyLength[i] && <span className="Popup__info Popup__section">Length: {parseFloat(identifyLength[i]).toFixed(2)} ft</span>) ||
            (!identifyLength[i] && <span className="Popup__info Popup__section">Length: N/A</span>)}
        </Carousel.Item>
      );
    } else {
      // For non-trails (transit stops, blue bike, T-stops, OpenSpace, etc): show all properties
      const allProperties = Object.entries(attrs)
        .filter(([key, value]) => {
          if (value === null || value === undefined) return false;
          const strValue = String(value).trim();
          const lowerValue = strValue.toLowerCase();
          return strValue !== '' && 
                 strValue !== '0' && 
                 lowerValue !== 'null' && 
                 lowerValue !== '<null>' && 
                 lowerValue !== '(null)' &&
                 lowerValue !== 'n/a' &&
                 lowerValue !== 'na';
        })
        .sort(([keyA], [keyB]) => {
          const importantFields = ['name', 'Name', 'STATION', 'station', 'Stop Name', 'stop_name', 'SITE_NAME', 'site_name', 'local_name', 'reg_name', 'prop_name', 'town', 'NAME'];
          const aImportant = importantFields.indexOf(keyA);
          const bImportant = importantFields.indexOf(keyB);
          if (aImportant !== -1 && bImportant !== -1) return aImportant - bImportant;
          if (aImportant !== -1) return -1;
          if (bImportant !== -1) return 1;
          return keyA.localeCompare(keyB);
        });
      
      carouselItems.push(
        <Carousel.Item key={i}>
          <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
            {(identifyLayer[i] && (
              <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#2774bd' }}>
                {identifyLayer[i].split(" ")[0] !== "Existing"
                  ? identifyLayer[i]
                  : identifyLayer[i].split(" ").slice(1, identifyLayer[i].split(" ").length).join(" ")}
              </div>
            ))}
            
            {allProperties.length > 0 ? (
              <div style={{ fontSize: '12px' }}>
                {allProperties.map(([key, value], idx) => {
                  let displayValue = value;
                  if (typeof value === 'number') {
                    if (key.toLowerCase().includes('length') || key.toLowerCase().includes('feet') || key.toLowerCase().includes('ft')) {
                      displayValue = parseFloat(value).toFixed(2) + ' ft';
                    } else if (key.toLowerCase().includes('acre')) {
                      displayValue = parseFloat(value).toFixed(2) + ' acres';
                    } else {
                      displayValue = value.toString();
                    }
                  } else if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  } else {
                    displayValue = String(value);
                  }
                  
                  const formattedKey = key
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
                  
                  return (
                    <div key={idx} style={{ marginBottom: '4px', paddingBottom: '4px', borderBottom: idx < allProperties.length - 1 ? '1px solid #e9ecef' : 'none' }}>
                      <span style={{ fontWeight: 500, color: '#333' }}>{formattedKey}:</span>{' '}
                      <span style={{ color: '#666' }}>{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No properties available</div>
            )}
          </div>
        </Carousel.Item>
      );
    }
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
      {/* Edit button only for trail tooltips */}
      {identifyResult.length > 0 && isTrailResult(identifyResult[carouselIndex]) && (
        <Button
          className="identify-contribute-btn"
          onClick={() => {
            toggleEditModal(true);
          }}
        >
          <img src={editIcon} alt={"Contribute Data"}></img>
        </Button>
      )}
    </Popup>
  );
};

export default CommunityIdentify;
