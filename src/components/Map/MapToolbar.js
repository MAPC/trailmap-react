import React, { useContext } from "react";
import { LayerContext } from "../../App";
import BasemapPanel from "../BasemapPanel";
import BoundariesPanel from "../BoundariesPanel";
import MapToolbarButton from "./MapToolbarButton";

const MapToolbar = ({
  showBasemapPanel,
  toggleBasemapPanel,
  showBoundariesPanel,
  toggleBoundariesPanel,
  onBoundaryLayerToggle,
  onBoundaryPanelOpen,
  showOneLayerNotice = false,
  onDismissOneLayerNotice,
  showBoundaries = true,
}) => {
  const {
    baseLayer,
    showMunicipalities,
    showMapcBoundary,
    showMaHouseDistricts,
    showMaSenateDistricts,
  } = useContext(LayerContext);

  const anyBoundaryActive =
    showMunicipalities ||
    showMapcBoundary ||
    showMaHouseDistricts ||
    showMaSenateDistricts;

  const openBasemapPanel = () => {
    toggleBoundariesPanel(false);
    toggleBasemapPanel(!showBasemapPanel);
  };

  const openBoundariesPanel = () => {
    const opening = !showBoundariesPanel;
    toggleBasemapPanel(false);
    toggleBoundariesPanel(opening);
    if (opening && typeof onBoundaryPanelOpen === "function") {
      onBoundaryPanelOpen();
    }
  };

  return (
    <div className="MapToolbar position-absolute">
      <div className="MapToolbar__group">
        <div className="MapToolbar__terrainAnchor">
          {showOneLayerNotice && (
            <div
              className="MapToolbar__notice"
              role="status"
              onClick={onDismissOneLayerNotice}
            >
              For clarity, only one map (Municipalities, MAPC Region, MA Senate, or MA House) is shown at a time
            </div>
          )}
          <MapToolbarButton
            iconClass="bi-layers-fill"
            label={baseLayer?.label || "Terrain"}
            isActive={showBasemapPanel}
            isOpen={showBasemapPanel}
            onClick={openBasemapPanel}
            ariaLabel="Choose basemap"
          />
        </div>
        {showBasemapPanel && <BasemapPanel />}
      </div>

      {showBoundaries && (
        <div className="MapToolbar__group">
          <MapToolbarButton
            iconClass="bi-bezier2"
            label="Boundaries"
            isActive={showBoundariesPanel || anyBoundaryActive}
            isOpen={showBoundariesPanel}
            onClick={openBoundariesPanel}
            ariaLabel="Choose boundary layer"
          />
          {showBoundariesPanel && (
            <BoundariesPanel onLayerToggle={onBoundaryLayerToggle} />
          )}
        </div>
      )}
    </div>
  );
};

export default MapToolbar;
