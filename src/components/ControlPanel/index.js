import React, { useContext, useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import TrailsOverviewPanel from "./TrailsOverviewPanel";
import MunicipalityProfile from "./MunicipalityProfile";
import ProjectTrailsProfile from "./ProjectTrailsProfile";
import { LayerContext } from "../../App";
import { useNavigate, useLocation } from "react-router-dom";

const ControlPanel = ({ 
  selectedRegNames = null,
  onToggleRegName = null,
  selectedMajorTrails = [],
  onToggleMajorTrail = null,
}) => {
  const navigate = useNavigate();
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
    showMunicipalityProfileMap,
    setShowMunicipalityProfileMap,
    showProjectTrailsView,
    setShowProjectTrailsView,
    showProjectTrailsProfileMap,
    setShowProjectTrailsProfileMap,
    projectRegNames,
    setProjectRegNames,
    selectedProjectRegName,
    setSelectedProjectRegName,
    projectColorPalette,
    setProjectColorPalette,
    // Layer toggle states from context
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
    showLandlinesFeatureService,
    setShowLandlinesFeatureService,
    showTrailsRegNameSync,
    setShowTrailsRegNameSync,
    showTransitLandStops,
    setShowTransitLandStops
  } = useContext(LayerContext);

  const [savedTrailLayers, setSavedTrailLayers] = useState([]);
  const [savedProposedLayers, setSavedProposedLayers] = useState([]);
  const isNavigatingRef = React.useRef(false);

  // Check URL parameters and path on initial load and when location changes
  useEffect(() => {
    // Skip if we're in the middle of a programmatic navigation
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sharedView = urlParams.get('view');
    const currentPath = location.pathname;
    
    if ((sharedView === 'municipality' || currentPath === '/communityTrailsProfile') && !showMunicipalityView) {
      // Automatically switch to municipality view
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
    } else if (currentPath === '/projectTrailsProfile' && !showProjectTrailsView) {
      // Automatically switch to project trails view
      setSavedTrailLayers([...trailLayers]);
      setSavedProposedLayers([...proposedLayers]);
      setTrailLayers([]);
      setProposedLayers([]);
      if (showMaHouseDistricts) toggleMaHouseDistricts(false);
      if (showMaSenateDistricts) toggleMaSenateDistricts(false);
      // Always turn off municipalities in project trails profile
      toggleMunicipalities(false);
      setShowProjectTrailsProfileMap(true);
      setShowProjectTrailsView(true);
    } else if (
      currentPath !== "/communityTrailsProfile" &&
      currentPath !== "/projectTrailsProfile" &&
      (showMunicipalityView || showProjectTrailsView)
    ) {
      // If we're not on a profile path but a view is active, switch back
      setTrailLayers(savedTrailLayers);
      setProposedLayers(savedProposedLayers);
      setShowMunicipalityProfileMap(false);
      setShowProjectTrailsProfileMap(false);
      setSelectedMunicipality(null);
      setShowMunicipalityView(false);
      setShowProjectTrailsView(false);
      setShowCommuterRail(false);
      setShowStationLabels(false);
      setShowBlueBikeStations(false);
      setShowSubwayStations(false);
      window.dispatchEvent(new CustomEvent('resetMunicipalityProfile'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Handle view toggle - show municipality profile map, hide trails
  const handleViewToggle = () => {
    if (!showMunicipalityView) {
      // Switching TO municipality view
      // Mark that we're doing a programmatic navigation
      isNavigatingRef.current = true;
      
      // Save current trail layers
      setSavedTrailLayers([...trailLayers]);
      setSavedProposedLayers([...proposedLayers]);
      
      // Clear all trail layers
      setTrailLayers([]);
      setProposedLayers([]);
      
      // Turn off other district layers
      if (showMaHouseDistricts) toggleMaHouseDistricts(false);
      if (showMaSenateDistricts) toggleMaSenateDistricts(false);
      
      // Turn off the regular municipalities button layer
      if (showMunicipalities) toggleMunicipalities(false);
      
      // Enable the municipality profile map layer instead
      setShowMunicipalityProfileMap(true);
      
      // Clear any selected municipality when entering the view
      setSelectedMunicipality(null);
      
      setShowMunicipalityView(true);
      
      // Navigate to /communityTrailsProfile
      navigate('/communityTrailsProfile');
    } else {
      // Switching BACK to trail filters
      // Mark that we're doing a programmatic navigation
      isNavigatingRef.current = true;
      
      // Restore saved trail layers
      setTrailLayers(savedTrailLayers);
      setProposedLayers(savedProposedLayers);
      
      // Disable the municipality profile map
      setShowMunicipalityProfileMap(false);
      
      // Clear selected municipality
      setSelectedMunicipality(null);
      
      // Reset municipality profile related states
      setShowMunicipalityView(false);
      
      // Reset all municipality profile map layer states
      setShowCommuterRail(false);
      setShowStationLabels(false);
      setShowBlueBikeStations(false);
      setShowSubwayStations(false);
      
      // Re-enable the regular municipalities button (if it was previously enabled)
      // Note: We don't automatically turn it on, just ensure it can be toggled
      
      // Dispatch events to reset Map component states
      window.dispatchEvent(new CustomEvent('resetMunicipalityProfile'));
      
      // Navigate back to root path
      navigate('/');
    }
  };

  // Track previous municipality to avoid unnecessary layer updates
  const prevMunicipalityNameRef = React.useRef(null);
  
  // When municipality is selected, enable trail layers for trails in that municipality
  React.useEffect(() => {
    if (showMunicipalityView && selectedMunicipality && municipalityTrails && municipalityTrails.length > 0) {
      // Only update layers if the municipality actually changed
      if (prevMunicipalityNameRef.current !== selectedMunicipality.name) {
        const trailLayerIds = new Set();
        const proposedLayerIds = new Set();
        
        municipalityTrails.forEach(trail => {
          // Find the corresponding layer
          const existingLayer = existingTrails.find(l => l.label === trail.layerName);
          const proposedLayer = proposedTrails.find(l => l.label === trail.layerName);
          
          if (existingLayer) {
            trailLayerIds.add(existingLayer.id);
          }
          if (proposedLayer) {
            proposedLayerIds.add(proposedLayer.id);
          }
        });
        
        // Enable the layers that have trails in this municipality
        setTrailLayers(Array.from(trailLayerIds));
        setProposedLayers(Array.from(proposedLayerIds));
        
        // Update the ref
        prevMunicipalityNameRef.current = selectedMunicipality.name;
      }
    } else if (!selectedMunicipality) {
      // Clear the ref when no municipality is selected
      prevMunicipalityNameRef.current = null;
    }
  }, [selectedMunicipality, municipalityTrails, showMunicipalityView]);

  // Handle project trails view toggle
  const handleProjectTrailsToggle = () => {
    if (!showProjectTrailsView) {
      // Switching TO project trails view
      isNavigatingRef.current = true;
      
      // Save current trail layers
      setSavedTrailLayers([...trailLayers]);
      setSavedProposedLayers([...proposedLayers]);
      
      // Clear all trail layers
      setTrailLayers([]);
      setProposedLayers([]);
      
      // Turn off other district layers
      if (showMaHouseDistricts) toggleMaHouseDistricts(false);
      if (showMaSenateDistricts) toggleMaSenateDistricts(false);
      // Always turn off municipalities in project trails profile
      toggleMunicipalities(false);
      
      // Enable the project trails profile map
      setShowProjectTrailsProfileMap(true);
      setShowProjectTrailsView(true);
      
      // Navigate to /projectTrailsProfile
      navigate('/projectTrailsProfile');
    } else {
      // Switching BACK to trail filters
      isNavigatingRef.current = true;
      
      // Restore saved trail layers
      setTrailLayers(savedTrailLayers);
      setProposedLayers(savedProposedLayers);
      
      // Disable the project trails profile map
      setShowProjectTrailsProfileMap(false);
      setShowProjectTrailsView(false);
      
      // Navigate back to root path
      navigate('/');
    }
  };

  return (
    <div className={`ControlPanel text-left pt-5 pb-5 ps-2 pe-2 position-absolute overflow-auto ${showProjectTrailsView ? 'project-trails-profile' : ''}`}>
      <div className="ControlPanel_opacity position-fixed"></div>
      <div>
        {showProjectTrailsView ? (
          <>
            <span className="ControlPanel__title lh-base d-block mt-2 mb-2">Regional Trails Profile</span>
            <Button 
              variant="outline-secondary"
              size="sm"
              className="w-100 mb-3 ControlPanel__toggle-btn"
              onClick={handleProjectTrailsToggle}
            >
              ← Back to Trail Filters
            </Button>

            {/* Map Layers Section */}
            <div className="mb-3 mt-3">
              <Form.Label className="small fw-semibold d-block mb-2">Map Layers</Form.Label>
              <Button
                variant={showEnvironmentalJustice ? "primary" : "outline-secondary"}
                size="sm"
                className="w-100 mb-2"
                onClick={() => {
                  const newState = !showEnvironmentalJustice;
                  setShowEnvironmentalJustice(newState);
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('toggleEnvironmentalJustice', { 
                      detail: { show: newState } 
                    }));
                  }, 10);
                }}
              >
                {showEnvironmentalJustice ? "Hide" : "Show"} Environmental Justice
              </Button>

              <Button
                variant={showOpenSpace ? "primary" : "outline-secondary"}
                size="sm"
                className="w-100 mb-2"
                onClick={() => {
                  const newState = !showOpenSpace;
                  setShowOpenSpace(newState);
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('toggleOpenSpace', { 
                      detail: { show: newState } 
                    }));
                  }, 10);
                }}
              >
                {showOpenSpace ? "Hide" : "Show"} OpenSpace
              </Button>
            </div>
          </>
        ) : showMunicipalityView ? (
          <>
            <span className="ControlPanel__title lh-base d-block mt-2 mb-2">Community Profile</span>
            <Button 
              variant="outline-secondary"
              size="sm"
              className="w-100 mb-3 ControlPanel__toggle-btn"
              onClick={handleViewToggle}
            >
              ← Back to Trail Filters
            </Button>
          </>
        ) : null}
       
        {!showProjectTrailsView && !showMunicipalityView && <TrailsOverviewPanel />}

        {showProjectTrailsView && (
          <div className="mt-2">
            <ProjectTrailsProfile
              regNames={projectRegNames || []}
              selectedRegNames={selectedRegNames instanceof Set ? selectedRegNames : (selectedRegNames ? new Set(selectedRegNames) : new Set())}
              onToggleRegName={onToggleRegName || (() => {})}
              selectedMajorTrails={selectedMajorTrails || []}
              onToggleMajorTrail={onToggleMajorTrail || (() => {})}
            />
          </div>
        )}

        {showMunicipalityView && (
          <div className="mt-2">
            <MunicipalityProfile
              selectedMunicipality={selectedMunicipality}
              onMunicipalitySelect={setSelectedMunicipality}
              municipalityTrails={municipalityTrails}
              onTrailClick={(trail) => {
                window.dispatchEvent(new CustomEvent('trailSelected', { 
                  detail: { trail } 
                }));
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
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
