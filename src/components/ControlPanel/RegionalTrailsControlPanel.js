import React, { useContext, useEffect, useRef } from "react";
import ProjectTrailsProfile from "./ProjectTrailsProfile";
import { LayerContext } from "../../App";
import { useLocation } from "react-router-dom";

const RegionalTrailsControlPanel = ({
  regNames = [],
  selectedRegNames = new Set(),
  onToggleRegName,
  selectedMajorTrails = [],
  onToggleMajorTrail,
  allTrailMetrics = {},
  detailTrail = null,
  onOpenDetail,
  onCloseDetail,
  onClearAll,
  onZoomToProject,
  allTrailsData = null,
  majorTrailsData = null,
}) => {
  const location = useLocation();
  const {
    trailLayers,
    setTrailLayers,
    proposedLayers,
    setProposedLayers,
    showMaHouseDistricts,
    toggleMaHouseDistricts,
    showMaSenateDistricts,
    toggleMaSenateDistricts,
    showMapcBoundary,
    toggleMapcBoundary,
    toggleMunicipalities,
    showProjectTrailsView,
    setShowProjectTrailsView,
    setShowProjectTrailsProfileMap,
    projectRegNames,
  } = useContext(LayerContext);

  const isNavigatingRef = useRef(false);

  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const currentPath = location.pathname;
    const isRegionalPath = currentPath === "/projectTrailsProfile";

    if (isRegionalPath && !showProjectTrailsView) {
      setTrailLayers([]);
      setProposedLayers([]);
      if (showMaHouseDistricts) toggleMaHouseDistricts(false);
      if (showMaSenateDistricts) toggleMaSenateDistricts(false);
      if (showMapcBoundary) toggleMapcBoundary(false);
      toggleMunicipalities(true);
      setShowProjectTrailsProfileMap(true);
      setShowProjectTrailsView(true);
    } else if (!isRegionalPath && showProjectTrailsView) {
      setShowProjectTrailsProfileMap(false);
      setShowProjectTrailsView(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="ControlPanel ControlPanel--regional text-left pt-5 pb-5 ps-2 pe-2 position-absolute overflow-auto project-trails-profile">
      <ProjectTrailsProfile
        regNames={regNames.length > 0 ? regNames : projectRegNames ?? []}
        selectedRegNames={
          selectedRegNames instanceof Set
            ? selectedRegNames
            : selectedRegNames
              ? new Set(selectedRegNames)
              : new Set()
        }
        onToggleRegName={onToggleRegName || (() => {})}
        selectedMajorTrails={selectedMajorTrails || []}
        onToggleMajorTrail={onToggleMajorTrail || (() => {})}
        allTrailMetrics={allTrailMetrics}
        detailTrail={detailTrail}
        onOpenDetail={onOpenDetail}
        onCloseDetail={onCloseDetail}
        onClearAll={onClearAll}
        onZoomToProject={onZoomToProject}
        allTrailsData={allTrailsData}
        majorTrailsData={majorTrailsData}
      />
    </div>
  );
};

export default RegionalTrailsControlPanel;
