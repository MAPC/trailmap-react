/** Reset all shared map + profile state when switching primary navigation. */
export const resetSharedNavigationState = ({
  setTrailLayers,
  setProposedLayers,
  setSelectedMunicipality,
  setMunicipalityTrails,
  toggleLandlineLayer,
  toggleLegislativeDistricts,
  toggleMaHouseDistricts,
  toggleMaSenateDistricts,
  toggleMunicipalities,
  toggleMapcBoundary,
  setShowCommuterRail,
  setShowStationLabels,
  setShowBlueBikeStations,
  setShowBlueBikeStationLabels,
  setShowSubwayStations,
  setShowSubwayStationLabels,
  setShowEnvironmentalJustice,
  setShowOpenSpace,
  setShowMuniOpenSpace,
  setShowProjectOpenSpace,
  setShowLandlinesFeatureService,
  setShowTransitLandStops,
  setProjectRegNames,
  setSelectedProjectRegName,
  setProjectColorPalette,
  showMaHouseDistricts,
  showMaSenateDistricts,
  showMunicipalities,
  showMapcBoundary,
  showLandlineLayer,
  showLegislativeDistricts,
}) => {
  setTrailLayers([]);
  setProposedLayers([]);
  setSelectedMunicipality(null);
  setMunicipalityTrails([]);
  setProjectRegNames([]);
  setSelectedProjectRegName(null);
  setProjectColorPalette({});

  if (showLandlineLayer) toggleLandlineLayer(false);
  if (showLegislativeDistricts) toggleLegislativeDistricts(false);
  if (showMaHouseDistricts) toggleMaHouseDistricts(false);
  if (showMaSenateDistricts) toggleMaSenateDistricts(false);
  if (showMunicipalities) toggleMunicipalities(false);
  if (showMapcBoundary && toggleMapcBoundary) toggleMapcBoundary(false);

  setShowCommuterRail(false);
  setShowStationLabels(false);
  setShowBlueBikeStations(false);
  if (setShowBlueBikeStationLabels) setShowBlueBikeStationLabels(false);
  setShowSubwayStations(false);
  if (setShowSubwayStationLabels) setShowSubwayStationLabels(false);
  setShowEnvironmentalJustice(false);
  setShowOpenSpace(false);
  if (setShowMuniOpenSpace) setShowMuniOpenSpace(false);
  if (setShowProjectOpenSpace) setShowProjectOpenSpace(false);
  setShowLandlinesFeatureService(false);
  setShowTransitLandStops(false);

  window.dispatchEvent(new CustomEvent("resetMunicipalityProfile"));
  window.dispatchEvent(new CustomEvent("resetRegionalProfile"));
};
