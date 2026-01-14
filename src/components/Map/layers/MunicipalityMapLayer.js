import React from "react";
import { Layer } from "react-map-gl";

/**
 * Renders municipality map layers
 */
const MunicipalityMapLayer = ({ showMunicipalityProfileMap, selectedMunicipality }) => {
  const profileLayers = [];
  
  if (!showMunicipalityProfileMap) {
    return profileLayers;
  }

  // Base layer - all unselected municipalities with light gray fill
  profileLayers.push(
    <Layer
      key="municipality-profile-base"
      id="municipality-profile-base"
      type="fill"
      source="municipalities"
      paint={{
        "fill-color": "rgba(200, 200, 200, 0.15)",
        "fill-outline-color": "transparent"
      }}
    />
  );

  // Dim unselected municipalities with light grey semi-transparent fill
  if (selectedMunicipality && selectedMunicipality.name) {
    profileLayers.push(
      <Layer
        key="municipality-profile-unselected"
        id="municipality-profile-unselected"
        type="fill"
        source="municipalities"
        paint={{
          "fill-color": "#CCCCCC",
          "fill-opacity": 0.4
        }}
        filter={["!=", ["downcase", ["get", "town"]], selectedMunicipality.name.toLowerCase()]}
      />
    );
  }

  // Outline for all municipalities - gray
  profileLayers.push(
    <Layer
      key="municipality-profile-outline"
      id="municipality-profile-outline"
      type="line"
      source="municipalities"
      paint={{
        "line-color": "#666666",
        "line-width": 1
      }}
    />
  );

  // Selected municipality outline - darker and slightly thicker for clear boundary
  if (selectedMunicipality && selectedMunicipality.name) {
    profileLayers.push(
      <Layer
        key="municipality-profile-selected-outline"
        id="municipality-profile-selected-outline"
        type="line"
        source="municipalities"
        paint={{
          "line-color": "#333333",
          "line-width": 2
        }}
        filter={["==", ["downcase", ["get", "town"]], selectedMunicipality.name.toLowerCase()]}
      />
    );
  }

  return profileLayers;
};

export default MunicipalityMapLayer;

