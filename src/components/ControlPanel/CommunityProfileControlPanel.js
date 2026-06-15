import React, { useContext, useState, useEffect, useRef } from "react";
import MunicipalityProfile from "./MunicipalityProfile";
import { LayerContext } from "../../App";
import { useLocation } from "react-router-dom";

const CommunityProfileControlPanel = ({ isLoadingTrails = false }) => {
  const location = useLocation();
  const {
    existingTrails,
    proposedTrails,
    selectedMunicipality,
    setSelectedMunicipality,
    municipalityTrails,
    trailLayers,
    setTrailLayers,
    proposedLayers,
    setProposedLayers,
    showMunicipalities,
    toggleMunicipalities,
    showMaHouseDistricts,
    toggleMaHouseDistricts,
    showMaSenateDistricts,
    toggleMaSenateDistricts,
    showMunicipalityView,
    setShowMunicipalityView,
    setShowMunicipalityProfileMap,
    showCommuterRail,
    setShowCommuterRail,
    showStationLabels,
    setShowStationLabels,
    showBlueBikeStations,
    setShowBlueBikeStations,
    showSubwayStations,
    setShowSubwayStations,
    showEnvironmentalJustice,
    setShowEnvironmentalJustice,
    showOpenSpace,
    setShowOpenSpace,
    showTrailsRegNameSync,
    setShowTrailsRegNameSync,
    showTransitLandStops,
    setShowTransitLandStops,
  } = useContext(LayerContext);

  const [savedTrailLayers, setSavedTrailLayers] = useState([]);
  const [savedProposedLayers, setSavedProposedLayers] = useState([]);
  const isNavigatingRef = useRef(false);
  const prevMunicipalityNameRef = useRef(null);

  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sharedView = urlParams.get("view");
    const currentPath = location.pathname;
    const isCommunityPath =
      sharedView === "municipality" || currentPath === "/communityTrailsProfile";

    if (isCommunityPath && !showMunicipalityView) {
      setSavedTrailLayers([...trailLayers]);
      setSavedProposedLayers([...proposedLayers]);
      setTrailLayers([]);
      setProposedLayers([]);
      if (showMaHouseDistricts) toggleMaHouseDistricts(false);
      if (showMaSenateDistricts) toggleMaSenateDistricts(false);
      if (showMunicipalities) toggleMunicipalities(false);
      setShowMunicipalityProfileMap(true);
      setSelectedMunicipality(null);
      setShowMunicipalityView(true);
    } else if (!isCommunityPath && showMunicipalityView) {
      setTrailLayers(savedTrailLayers);
      setProposedLayers(savedProposedLayers);
      setShowMunicipalityProfileMap(false);
      setSelectedMunicipality(null);
      setShowMunicipalityView(false);
      setShowCommuterRail(false);
      setShowStationLabels(false);
      setShowBlueBikeStations(false);
      setShowSubwayStations(false);
      window.dispatchEvent(new CustomEvent("resetMunicipalityProfile"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (
      showMunicipalityView &&
      selectedMunicipality &&
      municipalityTrails &&
      municipalityTrails.length > 0
    ) {
      if (prevMunicipalityNameRef.current !== selectedMunicipality.name) {
        const trailLayerIds = new Set();
        const proposedLayerIds = new Set();

        municipalityTrails.forEach((trail) => {
          const existingLayer = existingTrails.find((l) => l.label === trail.layerName);
          const proposedLayer = proposedTrails.find((l) => l.label === trail.layerName);

          if (existingLayer) trailLayerIds.add(existingLayer.id);
          if (proposedLayer) proposedLayerIds.add(proposedLayer.id);
        });

        setTrailLayers(Array.from(trailLayerIds));
        setProposedLayers(Array.from(proposedLayerIds));
        prevMunicipalityNameRef.current = selectedMunicipality.name;
      }
    } else if (!selectedMunicipality && showMunicipalityView) {
      setTrailLayers([]);
      setProposedLayers([]);
      prevMunicipalityNameRef.current = null;
    }
  }, [selectedMunicipality, municipalityTrails, showMunicipalityView]);

  return (
    <div className="ControlPanel ControlPanel--community text-left pt-5 pb-5 ps-2 pe-2 position-absolute overflow-auto">
      <div className="ControlPanel_opacity position-fixed" />
      <MunicipalityProfile
        isLoadingTrails={isLoadingTrails}
        selectedMunicipality={selectedMunicipality}
        onMunicipalitySelect={setSelectedMunicipality}
        municipalityTrails={municipalityTrails}
        onTrailClick={(trail) => {
          window.dispatchEvent(
            new CustomEvent("trailSelected", {
              detail: { trail },
            })
          );
        }}
        showCommuterRail={showCommuterRail}
        onToggleCommuterRail={setShowCommuterRail}
        showStationLabels={showStationLabels}
        onToggleStationLabels={setShowStationLabels}
        showBlueBikeStations={showBlueBikeStations}
        onToggleBlueBikeStations={setShowBlueBikeStations}
        showSubwayStations={showSubwayStations}
        onToggleSubwayStations={setShowSubwayStations}
        showEnvironmentalJustice={showEnvironmentalJustice}
        onToggleEnvironmentalJustice={setShowEnvironmentalJustice}
        showOpenSpace={showOpenSpace}
        onToggleOpenSpace={setShowOpenSpace}
        showTransitLandStops={showTransitLandStops}
        onToggleTransitLandStops={setShowTransitLandStops}
        showTrailsRegNameSync={showTrailsRegNameSync}
        onToggleTrailsRegNameSync={setShowTrailsRegNameSync}
      />
    </div>
  );
};

export default CommunityProfileControlPanel;
