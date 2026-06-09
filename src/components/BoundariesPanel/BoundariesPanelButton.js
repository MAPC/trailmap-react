import React, { useContext } from "react";
import { LayerContext } from "../../App";

const BOUNDARY_CONFIG = {
  municipalities: {
    label: "Municipalities Map",
    isOn: (ctx) => ctx.showMunicipalities,
    turnOn: (ctx) => {
      if (ctx.showMaHouseDistricts) ctx.toggleMaHouseDistricts(false);
      if (ctx.showMaSenateDistricts) ctx.toggleMaSenateDistricts(false);
      ctx.toggleMunicipalities(true);
    },
    turnOff: (ctx) => ctx.toggleMunicipalities(false),
  },
  house: {
    label: "MA House Districts",
    isOn: (ctx) => ctx.showMaHouseDistricts,
    turnOn: (ctx) => {
      if (ctx.showMunicipalities) ctx.toggleMunicipalities(false);
      if (ctx.showMaSenateDistricts) ctx.toggleMaSenateDistricts(false);
      ctx.toggleMaHouseDistricts(true);
    },
    turnOff: (ctx) => ctx.toggleMaHouseDistricts(false),
  },
  senate: {
    label: "MA Senate Districts",
    isOn: (ctx) => ctx.showMaSenateDistricts,
    turnOn: (ctx) => {
      if (ctx.showMaHouseDistricts) ctx.toggleMaHouseDistricts(false);
      if (ctx.showMunicipalities) ctx.toggleMunicipalities(false);
      ctx.toggleMaSenateDistricts(true);
    },
    turnOff: (ctx) => ctx.toggleMaSenateDistricts(false),
  },
};

const BoundariesPanelButton = ({ boundaryId, onLayerToggle }) => {
  const layerContext = useContext(LayerContext);
  const config = BOUNDARY_CONFIG[boundaryId];
  const isSelected = config.isOn(layerContext);

  const handleClick = () => {
    if (typeof onLayerToggle === "function") {
      onLayerToggle();
    }
    if (isSelected) {
      config.turnOff(layerContext);
    } else {
      config.turnOn(layerContext);
    }
  };

  return (
    <li
      className={
        isSelected
          ? "BoundariesPanel_list__item BoundariesPanel_list__item_selected"
          : "BoundariesPanel_list__item"
      }
      onClick={handleClick}
    >
      {config.label}
    </li>
  );
};

export default BoundariesPanelButton;
