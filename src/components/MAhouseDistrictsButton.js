import React, { useContext } from "react";
import { LayerContext } from "../App";

const MAhouseDistrictsButton = ({ onAnyLayerToggle }) => {
  const {
    showMaHouseDistricts,
    toggleMaHouseDistricts,
    showMunicipalities,
    toggleMunicipalities,
    showMaSenateDistricts,
    toggleMaSenateDistricts,
  } = useContext(LayerContext);

  return (
    <div className="LegislativeDistrictsButton position-absolute">
      <div
        className={showMaHouseDistricts ?
          "LegislativeDistrictsButton__item text-center text-decoration-none LegislativeDistrictsButton__item_selected" :
          "LegislativeDistrictsButton__item text-center text-decoration-none"}
        onClick={() => {
          if (typeof onAnyLayerToggle === 'function') onAnyLayerToggle();
          if (showMaHouseDistricts) {
            toggleMaHouseDistricts(false);
            return;
          }
          // enable House, disable others
          if (showMunicipalities) toggleMunicipalities(false);
          if (showMaSenateDistricts) toggleMaSenateDistricts(false);
          toggleMaHouseDistricts(true);
        }}>
        MA House Districts
      </div>
    </div>
  );
};

export default MAhouseDistrictsButton;
