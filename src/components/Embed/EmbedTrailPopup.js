import React from "react";
import { Popup } from "react-map-gl";
import { getMunicipalityName } from "../Map/utils/municipalityUtils";

const normalizeCandidate = (value) => {
  const text = (value ?? "").toString().trim();
  const lowered = text.toLowerCase();
  if (
    text === "" ||
    text === "0" ||
    lowered === "null" ||
    lowered === "<null>" ||
    lowered === "(null)" ||
    lowered === "n/a"
  ) {
    return "";
  }
  return text;
};

const getTrailName = (attributes = {}) => {
  const localName = normalizeCandidate(attributes["Local Name"] || attributes.local_name);
  const regionalName = normalizeCandidate(
    attributes["Regional Name"] || attributes.reg_name
  );
  const propertyName = normalizeCandidate(
    attributes["Property Name"] || attributes.prop_name
  );
  return localName || regionalName || propertyName || "N/A";
};

const getTrailType = (layerName = "") => {
  const parts = layerName.split(" ");
  if (parts[0] === "Existing") {
    return parts.slice(1).join(" ") || layerName;
  }
  return layerName || "Trail";
};

const getTrailLengthMiles = (attributes = {}) => {
  const rawLengthFeet = attributes.length_ft;
  if (
    rawLengthFeet == null ||
    rawLengthFeet === "Null" ||
    rawLengthFeet === "" ||
    rawLengthFeet === " "
  ) {
    return null;
  }
  const feet = Number(rawLengthFeet);
  if (!Number.isFinite(feet)) return null;
  return (feet / 5280).toFixed(2);
};

const EmbedTrailPopup = ({
  point,
  trails,
  index,
  onClose,
  onIndexChange,
}) => {
  if (!point || !trails?.length) return null;

  const trail = trails[index] || trails[0];
  const attributes = trail.attributes || {};
  const municipality =
    getMunicipalityName(attributes.muni_id || attributes["Municipal ID"]) || "";
  const lengthMiles = getTrailLengthMiles(attributes);
  const hasMultiple = trails.length > 1;

  return (
    <Popup
      longitude={point.lng}
      latitude={point.lat}
      anchor="top"
      offset={10}
      className="Popup CommunityProfileEmbed__popup"
      closeOnClick={false}
      onClose={onClose}
    >
      <div className="CommunityProfileEmbed__popupBody">
        <span className="Popup__name">Name: {getTrailName(attributes)}</span>
        <span className="Popup__layer Popup__section">
          Type: {getTrailType(trail.layerName)}
        </span>
        <span className="Popup__info Popup__section">
          Municipality: {municipality || "N/A"}
        </span>
        <span className="Popup__info Popup__section">
          Length: {lengthMiles != null ? `${lengthMiles} mi` : "N/A"}
        </span>
        {hasMultiple && (
          <div className="CommunityProfileEmbed__popupPager">
            <button
              type="button"
              onClick={() =>
                onIndexChange((index - 1 + trails.length) % trails.length)
              }
              aria-label="Previous trail"
            >
              ‹
            </button>
            <span>
              {index + 1} of {trails.length}
            </span>
            <button
              type="button"
              onClick={() => onIndexChange((index + 1) % trails.length)}
              aria-label="Next trail"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default EmbedTrailPopup;
