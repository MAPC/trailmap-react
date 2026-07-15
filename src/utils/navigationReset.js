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
  setShowCommuterRail,
  setShowStationLabels,
  setShowBlueBikeStations,
  setShowSubwayStations,
  setShowEnvironmentalJustice,
  setShowOpenSpace,
  setShowMuniOpenSpace,
  setShowLandlinesFeatureService,
  setShowTrailsRegNameSync,
  setShowTransitLandStops,
  setProjectRegNames,
  setSelectedProjectRegName,
  setProjectColorPalette,
  showMaHouseDistricts,
  showMaSenateDistricts,
  showMunicipalities,
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

  setShowCommuterRail(false);
  setShowStationLabels(false);
  setShowBlueBikeStations(false);
  setShowSubwayStations(false);
  setShowEnvironmentalJustice(false);
  setShowOpenSpace(false);
  if (setShowMuniOpenSpace) setShowMuniOpenSpace(false);
  setShowLandlinesFeatureService(false);
  setShowTrailsRegNameSync(false);
  setShowTransitLandStops(false);

  window.dispatchEvent(new CustomEvent("resetMunicipalityProfile"));
  window.dispatchEvent(new CustomEvent("resetRegionalProfile"));
};
