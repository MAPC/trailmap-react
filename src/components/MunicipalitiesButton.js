import React, { useContext } from "react";
import { LayerContext } from "../App";

const MunicipalitiesButton = () => {
  const { showMunicipalities, toggleMunicipalities } = useContext(LayerContext);

  return (
    <div className="MunicipalitiesButton position-absolute">
      <div
        className={showMunicipalities ?
          "MunicipalitiesButton__item text-center text-decoration-none MunicipalitiesButton__item_selected" :
          "MunicipalitiesButton__item text-center text-decoration-none"}
        onClick={() => toggleMunicipalities(!showMunicipalities)}>
        Municipalities Map
      </div>
    </div>
  );
};

export default MunicipalitiesButton;
