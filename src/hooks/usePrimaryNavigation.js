import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LayerContext } from "../App";

export const usePrimaryNavigation = () => {
  const navigate = useNavigate();
  const {
    setTrailLayers,
    setProposedLayers,
    setSelectedMunicipality,
    setShowMunicipalityProfileMap,
    setShowMunicipalityView,
    setShowProjectTrailsProfileMap,
    setShowProjectTrailsView,
    showMaHouseDistricts,
    toggleMaHouseDistricts,
    showMaSenateDistricts,
    toggleMaSenateDistricts,
    showMunicipalities,
    toggleMunicipalities,
  } = useContext(LayerContext);

  const enterCommunityProfile = () => {
    setTrailLayers([]);
    setProposedLayers([]);
    if (showMaHouseDistricts) toggleMaHouseDistricts(false);
    if (showMaSenateDistricts) toggleMaSenateDistricts(false);
    if (showMunicipalities) toggleMunicipalities(false);
    setShowMunicipalityProfileMap(true);
    setSelectedMunicipality(null);
    setShowMunicipalityView(true);
    navigate("/communityTrailsProfile");
  };

  const enterRegionalProfile = () => {
    setTrailLayers([]);
    setProposedLayers([]);
    if (showMaHouseDistricts) toggleMaHouseDistricts(false);
    if (showMaSenateDistricts) toggleMaSenateDistricts(false);
    toggleMunicipalities(false);
    setShowProjectTrailsProfileMap(true);
    setShowProjectTrailsView(true);
    navigate("/projectTrailsProfile");
  };

  const goToTrailsOverview = () => {
    setShowMunicipalityProfileMap(false);
    setShowMunicipalityView(false);
    setShowProjectTrailsProfileMap(false);
    setShowProjectTrailsView(false);
    setSelectedMunicipality(null);
    navigate("/");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return {
    goToTrailsOverview,
    goToDashboard,
    enterCommunityProfile,
    enterRegionalProfile,
  };
};
