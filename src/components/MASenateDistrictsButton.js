import React, { useContext } from "react";
import { LayerContext } from "../App";

const MASenateDistrictsButton = ({ onAnyLayerToggle }) => {
  const {
    showMaSenateDistricts,
    toggleMaSenateDistricts,
    showMaHouseDistricts,
    toggleMaHouseDistricts,
    showMunicipalities,
    toggleMunicipalities,
  } = useContext(LayerContext);

  return (
    <div className="MASenateDistrictsButton position-absolute">
      <div
        className={showMaSenateDistricts ?
          "MASenateDistrictsButton__item text-center text-decoration-none MASenateDistrictsButton__item_selected" :
          "MASenateDistrictsButton__item text-center text-decoration-none"}
        onClick={() => {
          if (typeof onAnyLayerToggle === 'function') onAnyLayerToggle();
          if (showMaSenateDistricts) {
            toggleMaSenateDistricts(false);
            return;
          }
          // enable Senate, disable others
          if (showMaHouseDistricts) toggleMaHouseDistricts(false);
          if (showMunicipalities) toggleMunicipalities(false);
          toggleMaSenateDistricts(true);
        }}>
        MA Senate Districts
      </div>
    </div>
  );
};

export default MASenateDistrictsButton;
