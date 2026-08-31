import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LayerContext } from "../App";
import { resetSharedNavigationState } from "../utils/navigationReset";

export const usePrimaryNavigation = () => {
  const navigate = useNavigate();
  const layerContext = useContext(LayerContext);

  const resetAll = () => {
    resetSharedNavigationState(layerContext);
  };

  const enterCommunityProfile = () => {
    resetAll();
    layerContext.setShowProjectTrailsProfileMap(false);
    layerContext.setShowProjectTrailsView(false);
    layerContext.setShowMunicipalityProfileMap(true);
    layerContext.setShowMunicipalityView(true);
    navigate("/communityTrailsProfile");
  };

  const enterRegionalProfile = () => {
    resetAll();
    layerContext.toggleMunicipalities(true);
    layerContext.setShowMunicipalityProfileMap(false);
    layerContext.setShowMunicipalityView(false);
    layerContext.setShowProjectTrailsProfileMap(true);
    layerContext.setShowProjectTrailsView(true);
    navigate("/projectTrailsProfile");
  };

  const goToTrailsOverview = () => {
    resetAll();
    layerContext.setShowMunicipalityProfileMap(false);
    layerContext.setShowMunicipalityView(false);
    layerContext.setShowProjectTrailsProfileMap(false);
    layerContext.setShowProjectTrailsView(false);
    navigate("/");
  };

  const enterTrailsOverviewWithAllLayers = () => {
    resetAll();
    layerContext.setShowMunicipalityProfileMap(false);
    layerContext.setShowMunicipalityView(false);
    layerContext.setShowProjectTrailsProfileMap(false);
    layerContext.setShowProjectTrailsView(false);
    const terrain = layerContext.basemaps.find((bm) => bm.id === "terrain");
    if (terrain) {
      layerContext.setBaseLayer(terrain);
    }
    layerContext.setTrailLayers(layerContext.existingTrails.map((trail) => trail.id));
    layerContext.setProposedLayers(layerContext.proposedTrails.map((trail) => trail.id));
    navigate("/");
  };

  const goToDashboard = () => {
    resetAll();
    layerContext.setShowMunicipalityProfileMap(false);
    layerContext.setShowMunicipalityView(false);
    layerContext.setShowProjectTrailsProfileMap(false);
    layerContext.setShowProjectTrailsView(false);
    navigate("/dashboard");
  };

  return {
    goToTrailsOverview,
    goToDashboard,
    enterCommunityProfile,
    enterRegionalProfile,
    enterTrailsOverviewWithAllLayers,
  };
};
