import React, { useContext } from "react";
import { LayerContext } from "../../App";

const turnOffOtherBoundaries = (ctx, keep) => {
  if (keep !== "municipalities" && ctx.showMunicipalities) ctx.toggleMunicipalities(false);
  if (keep !== "house" && ctx.showMaHouseDistricts) ctx.toggleMaHouseDistricts(false);
  if (keep !== "senate" && ctx.showMaSenateDistricts) ctx.toggleMaSenateDistricts(false);
  if (keep !== "mapc" && ctx.showMapcBoundary) ctx.toggleMapcBoundary(false);
};

const BOUNDARY_CONFIG = {
  municipalities: {
    label: "Municipalities Map",
    isOn: (ctx) => ctx.showMunicipalities,
    turnOn: (ctx) => {
      turnOffOtherBoundaries(ctx, "municipalities");
      ctx.toggleMunicipalities(true);
    },
    turnOff: (ctx) => ctx.toggleMunicipalities(false),
  },
  mapc: {
    label: "MAPC Region",
    isOn: (ctx) => ctx.showMapcBoundary,
    turnOn: (ctx) => {
      turnOffOtherBoundaries(ctx, "mapc");
      ctx.toggleMapcBoundary(true);
    },
    turnOff: (ctx) => ctx.toggleMapcBoundary(false),
  },
  house: {
    label: "MA House Districts",
    isOn: (ctx) => ctx.showMaHouseDistricts,
    turnOn: (ctx) => {
      turnOffOtherBoundaries(ctx, "house");
      ctx.toggleMaHouseDistricts(true);
    },
    turnOff: (ctx) => ctx.toggleMaHouseDistricts(false),
  },
  senate: {
    label: "MA Senate Districts",
    isOn: (ctx) => ctx.showMaSenateDistricts,
    turnOn: (ctx) => {
      turnOffOtherBoundaries(ctx, "senate");
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
