import React, { useContext } from "react";
import { LayerContext } from "../App";

const MunicipalitiesButton = ({ onAnyLayerToggle }) => {
  const {
    showMunicipalities,
    toggleMunicipalities,
    showMaHouseDistricts,
    toggleMaHouseDistricts,
    showMaSenateDistricts,
    toggleMaSenateDistricts,
  } = useContext(LayerContext);

  return (
    <div className="MunicipalitiesButton position-absolute">
      <div
        className={showMunicipalities ?
          "MunicipalitiesButton__item text-center text-decoration-none MunicipalitiesButton__item_selected" :
          "MunicipalitiesButton__item text-center text-decoration-none"}
        onClick={() => {
          if (typeof onAnyLayerToggle === 'function') onAnyLayerToggle();
          if (showMunicipalities) {
            toggleMunicipalities(false);
            return;
          }
          // enable Municipalities, disable others
          if (showMaHouseDistricts) toggleMaHouseDistricts(false);
          if (showMaSenateDistricts) toggleMaSenateDistricts(false);
          toggleMunicipalities(true);
        }}>
        Municipalities Map
      </div>
    </div>
  );
};

export default MunicipalitiesButton;
