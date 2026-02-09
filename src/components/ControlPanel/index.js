import React, { useContext, useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import TypeButton from "./TypeButton";
import Legend from "./Legend";
import MunicipalityProfile from "./MunicipalityProfile";
import RegionalTrailsProfile from "./RegionalTrailsProfile";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";
import { useNavigate, useLocation } from "react-router-dom";

const ControlPanel = ({ 
  selectedRegNames = null,
  onToggleRegName = null,
  selectedMajorTrails = [],
  onToggleMajorTrail = null
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showGlossaryModal, toggleGlossaryModal } = useContext(ModalContext);
  const { 
    existingTrails, 
    proposedTrails, 
    showLandlineLayer, 
    toggleLandlineLayer,
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
    showRegionalTrailsView,
    setShowRegionalTrailsView,
    showRegionalTrailsProfileMap,
    setShowRegionalTrailsProfileMap,
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

  const renderTypeButton = existingTrails.map((layer, index) => {
    return <TypeButton key={index} layer={layer} type="trail" />;
  });

  const renderProposedTypeButton = proposedTrails.map((layer, index) => {
    return <TypeButton key={index} layer={layer} type="proposed" />;
  });

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
      // Only save trail layers if we're coming from the original map view (not from another profile)
      if (!showRegionalTrailsView) {
        setSavedTrailLayers([...trailLayers]);
        setSavedProposedLayers([...proposedLayers]);
        setTrailLayers([]);
        setProposedLayers([]);
      }
      if (showMaHouseDistricts) toggleMaHouseDistricts(false);
      if (showMaSenateDistricts) toggleMaSenateDistricts(false);
      if (showMunicipalities) toggleMunicipalities(false);
      // Hide all map layers by default when switching profiles
      setShowCommuterRail(false);
      setShowStationLabels(false);
      setShowBlueBikeStations(false);
      setShowSubwayStations(false);
      setShowEnvironmentalJustice(false);
      setShowOpenSpace(false);
      setShowLandlinesFeatureService(false);
      setShowTrailsRegNameSync(false);
      setShowTransitLandStops(false);
      setShowMunicipalityProfileMap(true);
      setSelectedMunicipality(null);
      setShowMunicipalityView(true);
      // Disable regional trails profile when switching to community profile
      setShowRegionalTrailsProfileMap(false);
      setShowRegionalTrailsView(false);
    } else if (currentPath === '/regionalTrailsProfile' && !showRegionalTrailsView) {
      // Automatically switch to regional trails view
      // Only save trail layers if we're coming from the original map view (not from another profile)
      if (!showMunicipalityView) {
        setSavedTrailLayers([...trailLayers]);
        setSavedProposedLayers([...proposedLayers]);
        setTrailLayers([]);
        setProposedLayers([]);
      }
      if (showMaHouseDistricts) toggleMaHouseDistricts(false);
      if (showMaSenateDistricts) toggleMaSenateDistricts(false);
      // Always turn off municipalities in regional trails profile
      toggleMunicipalities(false);
      // Hide all map layers by default when switching profiles
      setShowCommuterRail(false);
      setShowStationLabels(false);
      setShowBlueBikeStations(false);
      setShowSubwayStations(false);
      setShowEnvironmentalJustice(false);
      setShowOpenSpace(false);
      setShowLandlinesFeatureService(false);
      setShowTrailsRegNameSync(false);
      setShowTransitLandStops(false);
      setShowRegionalTrailsProfileMap(true);
      setShowRegionalTrailsView(true);
      // Disable community profile when switching to regional profile
      setShowMunicipalityProfileMap(false);
      setShowMunicipalityView(false);
      setSelectedMunicipality(null);
    } else if (currentPath !== '/communityTrailsProfile' && currentPath !== '/regionalTrailsProfile' && (showMunicipalityView || showRegionalTrailsView)) {
      // If we're not on a profile path but a view is active, switch back
      setTrailLayers(savedTrailLayers);
      setProposedLayers(savedProposedLayers);
      setShowMunicipalityProfileMap(false);
      setShowRegionalTrailsProfileMap(false);
      setSelectedMunicipality(null);
      setShowMunicipalityView(false);
      setShowRegionalTrailsView(false);
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

  // Handle switch from Regional to Community Trails Profile (close EJ and OpenSpace by default)
  const handleSwitchToCommunityProfile = () => {
    isNavigatingRef.current = true;
    setShowEnvironmentalJustice(false);
    setShowOpenSpace(false);
    setShowCommuterRail(false);
    setShowStationLabels(false);
    setShowBlueBikeStations(false);
    setShowSubwayStations(false);
    setShowLandlinesFeatureService(false);
    setShowTrailsRegNameSync(false);
    setShowTransitLandStops(false);
    setShowRegionalTrailsProfileMap(false);
    setShowRegionalTrailsView(false);
    setShowMunicipalityProfileMap(true);
    setShowMunicipalityView(true);
    setSelectedMunicipality(null);
    navigate('/communityTrailsProfile');
  };

  // Handle switch from Community to Regional Trails Profile (close EJ and OpenSpace by default)
  const handleSwitchToRegionalProfile = () => {
    isNavigatingRef.current = true;
    setShowEnvironmentalJustice(false);
    setShowOpenSpace(false);
    setShowCommuterRail(false);
    setShowStationLabels(false);
    setShowBlueBikeStations(false);
    setShowSubwayStations(false);
    setShowLandlinesFeatureService(false);
    setShowTrailsRegNameSync(false);
    setShowTransitLandStops(false);
    toggleMunicipalities(false);
    setShowMunicipalityProfileMap(false);
    setShowMunicipalityView(false);
    setSelectedMunicipality(null);
    setShowRegionalTrailsProfileMap(true);
    setShowRegionalTrailsView(true);
    navigate('/regionalTrailsProfile');
  };

  // Handle regional trails view toggle
  const handleRegionalTrailsToggle = () => {
    if (!showRegionalTrailsView) {
      // Switching TO regional trails view
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
      // Always turn off municipalities in regional trails profile
      toggleMunicipalities(false);
      
      // Enable the regional trails profile map
      setShowRegionalTrailsProfileMap(true);
      setShowRegionalTrailsView(true);
      
      // Navigate to /regionalTrailsProfile
      navigate('/regionalTrailsProfile');
    } else {
      // Switching BACK to trail filters
      isNavigatingRef.current = true;
      
      // Restore saved trail layers
      setTrailLayers(savedTrailLayers);
      setProposedLayers(savedProposedLayers);
      
      // Disable the regional trails profile map
      setShowRegionalTrailsProfileMap(false);
      setShowRegionalTrailsView(false);
      
      // Navigate back to root path
      navigate('/');
    }
  };

  return (
    <div className={`ControlPanel text-left pt-5 pb-5 ps-2 pe-2 position-absolute overflow-auto ${showRegionalTrailsView ? 'regional-trails-profile' : ''}`}>
      <div className="ControlPanel_opacity position-fixed"></div>
      <div>
        {showRegionalTrailsView ? (
          <>
            <span className="ControlPanel__title lh-base d-block mt-2 mb-2">Regional Trails Profile</span>
            <Button 
              variant="outline-secondary"
              size="sm"
              className="w-100 mb-2 ControlPanel__toggle-btn"
              onClick={handleRegionalTrailsToggle}
            >
              ← Back to Trail Filters
            </Button>
            <Button 
              variant="primary"
              size="sm"
              className="w-100 mb-3 ControlPanel__toggle-btn"
              style={{
                backgroundColor: 'rgba(59, 131, 199, 0.85)',
                borderColor: 'rgba(59, 131, 199, 0.85)',
                color: 'white'
              }}
              onClick={handleSwitchToCommunityProfile}
            >
              View Community Trails Profile
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
            <span className="ControlPanel__title lh-base d-block mt-2 mb-2">Community Trails Profile</span>
            <Button 
              variant="outline-secondary"
              size="sm"
              className="w-100 mb-2 ControlPanel__toggle-btn"
              onClick={handleViewToggle}
            >
              ← Back to Trail Filters
            </Button>
            <Button 
              variant="primary"
              size="sm"
              className="w-100 mb-3 ControlPanel__toggle-btn"
              style={{
                backgroundColor: 'rgba(59, 131, 199, 0.85)',
                borderColor: 'rgba(59, 131, 199, 0.85)',
                color: 'white'
              }}
              onClick={handleSwitchToRegionalProfile}
            >
              View Regional Trails Profile
            </Button>
          </>
        ) : (
          <span className="ControlPanel__title lh-base d-block mt-2 mb-2">Find the trails that work for you!</span>
        )}
       
        {!showRegionalTrailsView && !showMunicipalityView && (
          <div className="mb-3">
            <Button 
              variant="primary"
              size="sm"
              className="w-100 mb-2 ControlPanel__toggle-btn"
              style={{
                backgroundColor: 'rgba(59, 131, 199, 0.85)',
                borderColor: 'rgba(59, 131, 199, 0.85)',
                color: 'white'
              }}
              onClick={handleViewToggle}
            >
              View Community Trails Profile
            </Button>
            <Button 
              variant="primary"
              size="sm"
              className="w-100 ControlPanel__toggle-btn"
              style={{
                backgroundColor: 'rgba(59, 131, 199, 0.85)',
                borderColor: 'rgba(59, 131, 199, 0.85)',
                color: 'white'
              }}
              onClick={handleRegionalTrailsToggle}
            >
              View Regional Trails Profile
            </Button>
          </div>
        )}

        {showRegionalTrailsView ? (
          <div className="mt-2">
            <RegionalTrailsProfile
              regNames={projectRegNames || []}
              selectedRegNames={selectedRegNames instanceof Set ? selectedRegNames : (selectedRegNames ? new Set(selectedRegNames) : new Set())}
              onToggleRegName={onToggleRegName || (() => {})}
              selectedMajorTrails={selectedMajorTrails || []}
              onToggleMajorTrail={onToggleMajorTrail || (() => {})}
            />
          </div>
        ) : !showMunicipalityView ? (
          <>
            <p>
              Select from various trail types to find trails best suited to your needs. Find a description of each to the
              trail types{" "}
              <span
                className="ControlPanel__glossary"
                onClick={() => {
                  toggleGlossaryModal(!showGlossaryModal);
                }}
              >
                here
              </span>
              .
            </p>
            <p>Click an existing or proposed trail on the map for more information.</p>
            
            <div>
              <span className="ControlPanel__subtitle mt-2 mb-2 d-block fw-bold">Existing:</span>
              <div className="ButtonGroup">
               {renderTypeButton}
              </div>
              
            </div>
            <div>
              <span className="ControlPanel__subtitle mt-2 mb-2 d-block fw-bold">Planned:</span>
              <div className="ButtonGroup">
              {renderProposedTypeButton}
              </div>
             
            </div>
            <div>
              <span className="ControlPanel__subtitle mt-2 mb-2 d-block fw-bold">Regional Greenway Network:</span>
              <Form.Check
                type="checkbox"
                id="default-checkbox"
                className="ControlPanel_checkbox mb-3 d-flex align-items-center"
                checked={showLandlineLayer}
                onChange={() => toggleLandlineLayer(!showLandlineLayer)}
                label={
                  <a 
                    href="https://mapc.github.io/embedded-map/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#0070cd', textDecoration: 'underline' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Show LandLine greenway layer
                  </a>
                }
              />
              <Legend />
            </div>
          </>
        ) : (
          <div className="mt-2">
            <MunicipalityProfile
              selectedMunicipality={selectedMunicipality}
              onMunicipalitySelect={setSelectedMunicipality}
              municipalityTrails={municipalityTrails}
              onTrailClick={(trail) => {
                // Trail click will be handled by parent Map component
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
