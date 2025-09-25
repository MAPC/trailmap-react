import React, { useContext } from "react";
import { LayerContext } from "../App";

const LegislativeDistrictsButton = () => {
  const { showLegislativeDistricts, toggleLegislativeDistricts } = useContext(LayerContext);

  return (
    <div className="LegislativeDistrictsButton position-absolute">
      <div
        className={showLegislativeDistricts ?
          "LegislativeDistrictsButton__item text-center text-decoration-none LegislativeDistrictsButton__item_selected" :
          "LegislativeDistrictsButton__item text-center text-decoration-none"}
        onClick={() => toggleLegislativeDistricts(!showLegislativeDistricts)}>
        Legislative Districts Map
      </div>
    </div>
  );
};

export default LegislativeDistrictsButton;
