import React, { useState, useEffect, useContext, useRef } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Dropdown from "react-bootstrap/Dropdown";
import * as turf from '@turf/turf';
import { LayerContext } from "../../App";
import massachusettsData from "../../data/massachusetts.json";

const MunicipalityProfile = ({ 
  selectedMunicipality, 
  onMunicipalitySelect,
  municipalityTrails,
  onTrailClick,
  onOpenTrailList,
  showCommuterRail,
  onToggleCommuterRail,
  showStationLabels,
  onToggleStationLabels,
  showBlueBikeStations,
  onToggleBlueBikeStations,
  showSubwayStations,
  onToggleSubwayStations
}) => {
  const { existingTrails, proposedTrails } = useContext(LayerContext);
  const [municipalities, setMunicipalities] = useState([]);
  const [trailStats, setTrailStats] = useState(null);
  const [selectedTrailIndex, setSelectedTrailIndex] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Reset component states when switching back to trail filters
  useEffect(() => {
    const handleResetMunicipalityProfile = () => {
      setTrailStats(null);
      setSelectedTrailIndex(null);
      setShowCompletionModal(false);
      setShowShareMenu(false);
    };
    
    window.addEventListener('resetMunicipalityProfile', handleResetMunicipalityProfile);
    
    return () => {
      window.removeEventListener('resetMunicipalityProfile', handleResetMunicipalityProfile);
    };
  }, []);

  // Extract municipality list from GeoJSON
  useEffect(() => {
    if (massachusettsData && massachusettsData.features) {
      const muniList = massachusettsData.features
        .map(feature => {
          const townName = feature.properties.town || feature.properties.NAME;
          return townName ? {
            name: townName.toLowerCase(),
            properties: feature.properties,
            geometry: feature.geometry
          } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setMunicipalities(muniList);

      // Check URL parameters for shared municipality
      const urlParams = new URLSearchParams(window.location.search);
      const sharedMuni = urlParams.get('muni');
      const sharedView = urlParams.get('view');
      const showCompletion = urlParams.get('showCompletion');
      
      if (sharedView === 'municipality' && sharedMuni && muniList.length > 0) {
        const foundMuni = muniList.find(m => m.name === sharedMuni.toLowerCase());
        if (foundMuni && onMunicipalitySelect) {
          // Small delay to ensure everything is loaded
          setTimeout(() => {
            onMunicipalitySelect(foundMuni);
            
            // If showCompletion parameter is present, open the completion modal
            if (showCompletion === 'true') {
              setTimeout(() => {
                setShowCompletionModal(true);
              }, 1000); // Additional delay to ensure municipality is selected and stats are calculated
            }
            
            // Clear URL parameters after loading from shared URL
            setTimeout(() => {
              const newUrl = window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
            }, 2000); // Clear URL after municipality is fully loaded
          }, 500);
        }
      }
    }
  }, []);

  // Reset municipality profile states when a new municipality is selected
  // Track previous municipality to detect actual changes
  const prevMunicipalityRef = useRef(null);
  
  useEffect(() => {
    if (selectedMunicipality) {
      // Only reset if the municipality actually changed (not just re-rendered)
      const municipalityChanged = prevMunicipalityRef.current !== null && 
                                  prevMunicipalityRef.current?.name !== selectedMunicipality.name;
      
      if (municipalityChanged) {
        // Reset all municipality profile states when a new municipality is selected
        setTrailStats(null);
        setSelectedTrailIndex(null);
        setShowCompletionModal(false);
        setShowShareMenu(false);
        
        // Reset buffer analysis when selecting a new municipality
        window.dispatchEvent(new CustomEvent('resetBufferAnalysis'));
        
        console.log('Reset municipality profile states for new municipality:', selectedMunicipality.name);
      }
      
      // Update the ref to current municipality
      prevMunicipalityRef.current = selectedMunicipality;
    }
  }, [selectedMunicipality]);

  // Calculate trail statistics when municipality or trails change
  useEffect(() => {
    if (selectedMunicipality && municipalityTrails) {
      calculateTrailStats();
    }
  }, [selectedMunicipality, municipalityTrails]);

  const calculateTrailStats = () => {
    if (!municipalityTrails || municipalityTrails.length === 0) {
      setTrailStats({
        totalTrails: 0,
        totalLength: 0,
        byType: {},
        completionRates: {},
        density: 0,
        area: 0
      });
      return;
    }

    const stats = {
      totalTrails: municipalityTrails.length,
      totalLength: 0,
      byType: {},
      completionRates: {},
      density: 0,
      area: 0
    };

    // Calculate municipality area and trail density
    if (selectedMunicipality && selectedMunicipality.geometry) {
      try {
        let area = 0;
        
        // Handle both Polygon and MultiPolygon geometries
        if (selectedMunicipality.geometry.type === 'Polygon') {
          const muniPolygon = turf.polygon(selectedMunicipality.geometry.coordinates);
          area = turf.area(muniPolygon) * 10.764; // Convert from sq meters to sq feet
        } else if (selectedMunicipality.geometry.type === 'MultiPolygon') {
          const muniMultiPolygon = turf.multiPolygon(selectedMunicipality.geometry.coordinates);
          area = turf.area(muniMultiPolygon) * 10.764; // Convert from sq meters to sq feet
        }
        
        stats.area = area;
        console.log(`Municipality area calculated: ${area} sq feet for ${selectedMunicipality.name}`);
      } catch (error) {
        console.error('Error calculating municipality area:', error);
      }
    }

    // Initialize counts for all trail types
    [...existingTrails, ...proposedTrails].forEach(trailType => {
     
      stats.byType[trailType.label] = {
        count: 0,
        length: 0,
        color: trailType.paint['line-color']
      };
    });

    // Count trails by type
    municipalityTrails.forEach(trail => {
      const layerName = trail.layerName || 'Unknown';
      
      // Get length from various possible attribute names (in feet) and convert to number
      // Use the same logic as Identify component
      const rawLengthFeet = trail.attributes?.['Facility Length in Feet'] ?? trail.attributes?.length_ft;
      const lengthValue = 
        (rawLengthFeet !== undefined && rawLengthFeet !== null && rawLengthFeet !== "Null" && rawLengthFeet !== " ")
          ? rawLengthFeet
          : trail.attributes?.Shape_Length || 0;
      
      // Ensure it's a number, not a string
      const lengthInFeet = Number(lengthValue) || 0;
      
      
      if (stats.byType[layerName]) {
        stats.byType[layerName].count += 1;
        stats.byType[layerName].length += lengthInFeet;
      }
      
      stats.totalLength += lengthInFeet;
    });

    // Calculate trail density (feet per square mile)
    if (stats.area > 0) {
      const areaInSqMiles = stats.area / 27878400; // Convert sq feet to sq miles
      stats.density = areaInSqMiles > 0 ? Math.round((stats.totalLength / areaInSqMiles) * 10) / 10 : 0;
      
    }

    // Calculate completion rates for trail type pairs
    // Map planned types to their existing counterparts
    const typeMapping = {
      'Planned Protected Bike Lanes': 'Protected Bike Lanes',
      'Planned Bike Lanes': 'Bike Lanes',
      'Planned Paved Foot Path': 'Paved Foot Path',
      'Planned Natural Surface Path': 'Natural Surface Path',
      'Planned Paved Shared Use': 'Paved Shared Use',
      'Planned Unimproved Shared Use': 'Unimproved Shared Use'
    };

    Object.entries(typeMapping).forEach(([plannedType, existingType]) => {
      const existingLength = stats.byType[existingType]?.length || 0;
      const plannedLength = stats.byType[plannedType]?.length || 0;
      const totalPlanned = existingLength + plannedLength;
      
      if (totalPlanned > 0) {
        const completionRate = (existingLength / totalPlanned) * 100;
        stats.completionRates[existingType] = {
          existing: existingLength,
          planned: plannedLength,
          total: totalPlanned,
          rate: completionRate
        };
      }
    });

    setTrailStats(stats);
  };

  const handleMunicipalityChange = (e) => {
    const muniName = e.target.value;
    if (muniName) {
      const selected = municipalities.find(m => m.name === muniName);
      onMunicipalitySelect(selected);
    } else {
      onMunicipalitySelect(null);
    }
  };

  const formatLength = (feet) => {
    // Ensure feet is a number, then format with commas for readability
    const numFeet = Number(feet) || 0;
    return numFeet.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const capitalizeWords = (str) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const handleShareProfile = async () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      view: 'municipality',
      muni: selectedMunicipality?.name || '',
      showCompletion: 'true' // Add parameter to indicate completion modal should open
    });
    const shareUrl = `${baseUrl}?${params.toString()}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      
      // Create toast element and append to body
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          z-index: 999999 !important;
          background-color: #28a745;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        ">
          <i class="fas fa-check-circle"></i>
          Link copied to clipboard!
        </div>
      `;
      
      document.body.appendChild(toast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
      
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // Show toast for fallback too
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          z-index: 999999 !important;
          background-color: #28a745;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          pointer-events: none;
        ">
          <i class="fas fa-check-circle"></i>
          Link copied to clipboard!
        </div>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    }
  };

  return (
    <div className="MunicipalityProfile mt-3">
      <div className="MunicipalityProfile__header mb-3">
        <p>
          Select a municipality from the dropdown or click on a municipality on the map to view its trail network statistics and details.
        </p>
      </div>

      {/* Map Layers Toggle */}
      <div className="mb-3">
        <Form.Label className="small fw-semibold d-block mb-2">Map Layers</Form.Label>
        <Button
          variant={showCommuterRail ? "primary" : "outline-secondary"}
          size="sm"
          className="w-100 mb-2"
          onClick={() => {
            const newState = !showCommuterRail;
            // Update parent component state
            if (onToggleCommuterRail) {
              onToggleCommuterRail(newState);
            }
            // Notify Map component with slight delay to ensure state is updated
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('toggleCommuterRail', { 
                detail: { show: newState } 
              }));
            }, 10);
          }}
        >
          {showCommuterRail ? "Hide" : "Show"} Commuter Rail
        </Button>
        
        {/* Station Labels Checkbox - only show when Commuter Rail is enabled */}
        {showCommuterRail && (
          <Form.Check
            type="checkbox"
            id="station-labels-toggle"
            label="Show station labels"
            checked={showStationLabels}
            onChange={(e) => {
              const newState = e.target.checked;
              if (onToggleStationLabels) {
                onToggleStationLabels(newState);
              }
              // Notify Map component
              window.dispatchEvent(new CustomEvent('toggleStationLabels', { 
                detail: { show: newState } 
              }));
            }}
            className="small"
          />
        )}
        
        <Button
          variant={showBlueBikeStations ? "primary" : "outline-secondary"}
          size="sm"
          className="w-100 mb-2"
          onClick={() => {
            const newState = !showBlueBikeStations;
            // Update parent component state
            if (onToggleBlueBikeStations) {
              onToggleBlueBikeStations(newState);
            }
            // Notify Map component with slight delay to ensure state is updated
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('toggleBlueBikeStations', { 
                detail: { show: newState } 
              }));
            }, 10);
          }}
        >
          {showBlueBikeStations ? "Hide" : "Show"} Blue Bike Stations
        </Button>

        <Button
          variant={showSubwayStations ? "primary" : "outline-secondary"}
          size="sm"
          className="w-100 mb-2"
          onClick={() => {
            const newState = !showSubwayStations;
            // Update parent component state
            if (onToggleSubwayStations) {
              onToggleSubwayStations(newState);
            }
            // Notify Map component with slight delay to ensure state is updated
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('toggleSubwayStations', { 
                detail: { show: newState } 
              }));
            }, 10);
          }}
        >
          {showSubwayStations ? "Hide" : "Show"} MBTA Subway Stations
        </Button>
      </div>

      <Form.Group className="mb-3">
        <Form.Label className="small fw-semibold">Select Municipality</Form.Label>
        <Form.Select 
          size="sm"
          value={selectedMunicipality?.name || ''}
          onChange={handleMunicipalityChange}
          className="MunicipalityProfile__select"
        >
          <option value="">-- Choose a municipality --</option>
          {municipalities.map((muni, idx) => (
            <option key={idx} value={muni.name}>
              {capitalizeWords(muni.name)}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {selectedMunicipality && (
        <div className="MunicipalityProfile__content">
          <div className="MunicipalityProfile__overview mb-3 p-2 border rounded">
            <h6 className="fw-bold mb-2">
              {capitalizeWords(selectedMunicipality.name)}
            </h6>
            
            {trailStats && (
              <>
                <div className="MunicipalityProfile__stats">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small text-muted">Total Trails:</span>
                    <span className="small fw-semibold">{trailStats.totalTrails}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small text-muted">Total Length:</span>
                    <span className="small fw-semibold">
                      {formatLength(trailStats.totalLength)} ft
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="small text-muted">Trail Density (existing only):</span>
                    <span className="small fw-semibold">
                      {trailStats.density} ft/mi²
                    </span>
                  </div>
                </div>
                
                {/* View Details Button */}
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="w-100 mt-2"
                  onClick={() => setShowCompletionModal(true)}
                >
                  View Trail Details & Completion Rates
                </Button>
              </>
            )}
          </div>


          {municipalityTrails && municipalityTrails.length > 0 && (
            <div className="mb-2">
              <Button 
                variant="outline-success" 
                size="sm" 
                className="w-100 mb-2"
                onClick={() => {
                  if (onOpenTrailList) {
                    onOpenTrailList();
                  }
                }}
              >
                <span className="fw-semibold">{municipalityTrails.length} trails found</span>
                <span className="ms-2">→ Open Trail List</span>
              </Button>
              
              <Button 
                variant="outline-info" 
                size="sm" 
                className="w-100"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openBufferAnalysis'));
                }}
              >
                Buffer Analysis Tool
              </Button>
            </div>
          )}

          {(!municipalityTrails || municipalityTrails.length === 0) && selectedMunicipality && (
            <div className="alert alert-info small p-2 mb-2">
              No trails found in this municipality.
            </div>
          )}
        </div>
      )}

      {/* Completion Rates Modal */}
      <Modal 
        show={showCompletionModal} 
        onHide={() => setShowCompletionModal(false)}
        size="xl"
        centered
        scrollable
        className="CompletionRatesModal"
        style={{ maxWidth: '90vw' }}
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="w-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span>Trail Network Completion Rates</span>
                {selectedMunicipality && (
                  <div className="text-muted fs-6 fw-normal mt-1">
                    {capitalizeWords(selectedMunicipality.name)}
                  </div>
                )}
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleShareProfile}
                className="MunicipalityProfile__share-btn"
                title="Share this municipality profile"
              >
                <i className="fas fa-share-alt me-1"></i>
                Share Profile
              </Button>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedMunicipality && (
            <div className="alert alert-info mb-4">
              <div className="d-flex align-items-start">
                <div className="small">
                  <strong>Completion Rate</strong> shows the percentage of existing trails compared to the total planned network (existing + planned).
                  Higher percentages indicate more trail infrastructure is already built.
                </div>
              </div>
            </div>
          )}

          {/* Trail Density Information */}
          {trailStats && (
            <div className="alert alert-light mb-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="text-muted small">Total Trails</div>
                    <div className="fw-bold fs-5">{trailStats.totalTrails}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="text-muted small">Total Length</div>
                    <div className="fw-bold fs-5">{formatLength(trailStats.totalLength)} ft</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="text-muted small">Trail Density (existing only)</div>
                    <div className="fw-bold fs-5">{trailStats.density} ft/mi²</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Trail Types Section */}
          {trailStats && Object.keys(trailStats.byType).length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center">
                All Trail Types in {selectedMunicipality && capitalizeWords(selectedMunicipality.name)}
              </h6>
              <div className="row g-2">
                {Object.entries(trailStats.byType)
                  .filter(([_, data]) => data.count > 0)
                  .sort(([, a], [, b]) => b.length - a.length)
                  .map(([type, data]) => (
                    <div key={type} className="col-12 col-md-6">
                      <div className="card border shadow-sm h-100">
                        <div className="card-body p-3">
                          <div className="d-flex align-items-start mb-2">
                            <div 
                              style={{
                                width: '4px',
                                height: '100%',
                                backgroundColor: data.color,
                                marginRight: '12px',
                                borderRadius: '2px',
                                minHeight: '40px'
                              }}
                            />
                            <div className="flex-grow-1">
                              <h6 className="mb-1 fw-semibold" style={{ fontSize: '0.9rem' }}>
                                {type}
                              </h6>
                              <div className="row g-2 mt-1">
                                <div className="col-6">
                                  <div className="text-muted small" style={{ fontSize: '0.7rem' }}>COUNT</div>
                                  <div className="fw-bold">{data.count} trails</div>
                                </div>
                                <div className="col-6">
                                  <div className="text-muted small" style={{ fontSize: '0.7rem' }}>LENGTH</div>
                                  <div className="fw-bold">{formatLength(data.length)} ft</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Completion Rates Section */}
          {trailStats && trailStats.completionRates && Object.keys(trailStats.completionRates).length > 0 && (
            <>
              <h6 className="fw-bold mb-3 d-flex align-items-center">
                Trail Network Completion Rates
              </h6>
              <div className="row g-2">
              {Object.entries(trailStats.completionRates)
                .sort(([, a], [, b]) => b.rate - a.rate)
                .map(([type, data], index) => (
                  <div 
                    key={type} 
                    className="col-12 mb-2"
                  >
                    <div className="completion-rate-card card shadow-sm border-0">
                      <div className="card-body p-2">
                        <div className="d-flex align-items-center justify-content-between">
                          {/* Left side: Type name and progress */}
                          <div className="flex-grow-1 pe-3" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center mb-2">
                              <h6 className="mb-0 fw-semibold text-truncate" style={{ fontSize: '0.85rem' }}>
                                {type}
                              </h6>
                            </div>
                            <div className="progress mb-2" style={{ height: '8px', borderRadius: '4px' }}>
                              <div 
                                className={`progress-bar ${
                                  data.rate >= 75 ? 'bg-success' : 
                                  data.rate >= 50 ? 'bg-warning' : 
                                  'bg-danger'
                                }`}
                                role="progressbar" 
                                style={{ 
                                  width: `${data.rate}%`,
                                  transition: 'width 0.6s ease'
                                }}
                                aria-valuenow={data.rate} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <div className="d-flex align-items-center small" style={{ fontSize: '0.75rem' }}>
                              <span className="text-success me-3">
                                <strong>Existing:</strong> {formatLength(data.existing)} ft
                              </span>
                              <span className="text-warning me-3">
                                <strong>Planned:</strong> {formatLength(data.planned)} ft
                              </span>
                              <span className="text-muted">
                                <strong>Total:</strong> {formatLength(data.total)} ft
                              </span>
                            </div>
                          </div>
                          
                          {/* Right side: Percentage */}
                          <div className="text-end" style={{ minWidth: '80px' }}>
                            <div className="fw-bold" style={{ 
                              fontSize: '1.5rem',
                              lineHeight: '1',
                              color: data.rate >= 75 ? '#198754' : data.rate >= 50 ? '#fd7e14' : '#dc3545'
                            }}>
                              {data.rate.toFixed(1)}%
                            </div>
                            <div className="small text-muted" style={{ fontSize: '0.65rem' }}>
                              Complete
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <div className="w-100 d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2 align-items-center">
              <small className="text-muted d-flex align-items-center">
                {trailStats && (
                  <>
                    {Object.keys(trailStats.byType).filter(key => trailStats.byType[key].count > 0).length} trail type(s)
                    {trailStats.completionRates && Object.keys(trailStats.completionRates).length > 0 && 
                      ` • ${Object.keys(trailStats.completionRates).length} with completion data`
                    }
                  </>
                )}
              </small>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowCompletionModal(false)}>
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default MunicipalityProfile;

