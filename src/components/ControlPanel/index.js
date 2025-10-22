import React, { useContext, useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import TypeButton from "./TypeButton";
import Legend from "./Legend";
import MunicipalityProfile from "./MunicipalityProfile";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";

const ControlPanel = () => {
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
    showMunicipalityProfileMap,
    setShowMunicipalityProfileMap
  } = useContext(LayerContext);

  const [showMunicipalityView, setShowMunicipalityView] = useState(false);
  const [savedTrailLayers, setSavedTrailLayers] = useState([]);
  const [savedProposedLayers, setSavedProposedLayers] = useState([]);
  const [showCommuterRail, setShowCommuterRail] = useState(false);
  const [showStationLabels, setShowStationLabels] = useState(false);
  const [showBlueBikeStations, setShowBlueBikeStations] = useState(false);

  const renderTypeButton = existingTrails.map((layer, index) => {
    return <TypeButton key={index} layer={layer} type="trail" />;
  });

  const renderProposedTypeButton = proposedTrails.map((layer, index) => {
    return <TypeButton key={index} layer={layer} type="proposed" />;
  });

  // Check URL parameters on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedView = urlParams.get('view');
    
    if (sharedView === 'municipality' && !showMunicipalityView) {
      // Automatically switch to municipality view
      handleViewToggle();
    }
  }, []); // Run only once on mount

  // Handle view toggle - show municipality profile map, hide trails
  const handleViewToggle = () => {
    if (!showMunicipalityView) {
      // Switching TO municipality view
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
    } else {
      // Switching BACK to trail filters
      // Restore saved trail layers
      setTrailLayers(savedTrailLayers);
      setProposedLayers(savedProposedLayers);
      
      // Disable the municipality profile map
      setShowMunicipalityProfileMap(false);
      
      // Clear selected municipality
      setSelectedMunicipality(null);
      
      // Reset municipality profile related states
      setShowMunicipalityView(false);
      
      // Reset commuter rail states
      setShowCommuterRail(false);
      setShowStationLabels(false);
      
      // Re-enable the regular municipalities button (if it was previously enabled)
      // Note: We don't automatically turn it on, just ensure it can be toggled
      
      // Dispatch events to reset Map component states
      window.dispatchEvent(new CustomEvent('resetMunicipalityProfile'));
    }
  };

  // When municipality is selected, enable trail layers for trails in that municipality
  React.useEffect(() => {
    if (showMunicipalityView && selectedMunicipality && municipalityTrails && municipalityTrails.length > 0) {
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
    }
  }, [selectedMunicipality, municipalityTrails, showMunicipalityView]);

  return (
    <div className="ControlPanel text-left pt-5 pb-5 ps-2 pe-2 position-absolute overflow-auto">
      <div className="ControlPanel_opacity position-fixed"></div>
      <div>
        {showMunicipalityView ? <span className="ControlPanel__title lh-base d-block mt-2 mb-2">Community Trails Profile</span> : <span className="ControlPanel__title lh-base d-block mt-2 mb-2">Find the trails that work for you!</span>}
       
        
        <Button 
          variant={showMunicipalityView ? "outline-secondary" : "primary"}
          size="sm"
          className="w-100 mb-3 ControlPanel__toggle-btn"
          style={{
            backgroundColor: showMunicipalityView ? undefined : 'rgba(59, 131, 199, 0.85)',
            borderColor: showMunicipalityView ? undefined : 'rgba(59, 131, 199, 0.85)',
            color: showMunicipalityView ? undefined : 'white'
          }}
          onClick={handleViewToggle}
        >
          {showMunicipalityView ? "← Back to Trail Filters" : "View Community Trails Profile"}
        </Button>

        {!showMunicipalityView ? (
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
              onOpenTrailList={() => {
                // Trigger opening trail list window
                window.dispatchEvent(new CustomEvent('openTrailList'));
              }}
              showCommuterRail={showCommuterRail}
              onToggleCommuterRail={setShowCommuterRail}
              showStationLabels={showStationLabels}
              onToggleStationLabels={setShowStationLabels}
              showBlueBikeStations={showBlueBikeStations}
              onToggleBlueBikeStations={setShowBlueBikeStations}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
