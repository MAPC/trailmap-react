import React, { useState } from "react";

const ProjectMetricsPanel = ({ 
  selectedRegNames = new Set(),
  selectedMajorTrails = [],
  projectMetrics = {},
  onZoomToProject = null,
  allTrailsData = null,
  majorTrailsData = null
}) => {
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [expandedLengthByType, setExpandedLengthByType] = useState(new Map()); // Map of projectName -> { existing: true/false, planned: true/false, gap: true/false }

  // Combine regular projects and major trails, reverse order so newest selected projects appear at the top
  const regularProjects = Array.from(selectedRegNames).map(regName => ({
    regName,
    metrics: projectMetrics[regName]
  }));
  
  const majorTrails = selectedMajorTrails.map(majorTrailName => ({
    regName: majorTrailName,
    metrics: projectMetrics[majorTrailName]
  }));
  
  const selectedProjectsMetrics = [...regularProjects, ...majorTrails]
    .filter(item => item.metrics)
    .reverse(); // Reverse to show newest at top

  const toggleProject = (regName) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(regName)) {
      newExpanded.delete(regName);
    } else {
      newExpanded.add(regName);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleLengthByTypeSection = (regName, section) => {
    const newExpanded = new Map(expandedLengthByType);
    const projectState = newExpanded.get(regName) || { existing: true, planned: true, gap: true };
    projectState[section] = !projectState[section];
    newExpanded.set(regName, projectState);
    setExpandedLengthByType(newExpanded);
  };

  // Download GeoJSON for a specific trail
  const downloadTrailGeoJSON = (regName, e) => {
    e.stopPropagation();
    
    let trailFeatures = [];
    
    // Check if it's a major trail
    const isMajorTrail = selectedMajorTrails.includes(regName);
    
    if (isMajorTrail && majorTrailsData && majorTrailsData.features) {
      // Filter major trails by grouped_reg_name
      trailFeatures = majorTrailsData.features.filter(
        feature => {
          const groupedRegName = (feature.properties?.grouped_reg_name || "").trim();
          return groupedRegName === regName.trim();
        }
      );
    } else if (allTrailsData && allTrailsData.features) {
      // Filter regular trails by reg_name
      trailFeatures = allTrailsData.features.filter(
        feature => (feature.properties?.reg_name || "").trim() === regName.trim()
      );
    }
    
    if (trailFeatures.length === 0) {
      alert(`No trail data available for ${regName}`);
      return;
    }
    
    // Create GeoJSON FeatureCollection
    const geoJSON = {
      type: "FeatureCollection",
      features: trailFeatures
    };
    
    // Create filename from regName (sanitize for filesystem)
    const sanitizedName = regName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedName}_trails.geojson`;
    
    // Create blob and download
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Render metrics for a single project
  const renderProjectMetrics = (projectItem, index) => {
    const { regName, metrics } = projectItem;
    const isExpanded = expandedProjects.has(regName);
    
    return (
      <div 
        key={`metrics-${regName}-${index}`}
        className="project-metrics-card"
        style={{
          marginBottom: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Project Header - Always Visible */}
        <div 
          className="project-header"
          style={{
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderBottom: isExpanded ? '2px solid #2774bd' : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s'
          }}
          onClick={() => toggleProject(regName)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e9ecef';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
        >
          <div style={{ flex: 1 }}>
            <h6 
              className="mb-1" 
              style={{ 
                fontSize: '15px', 
                fontWeight: 600, 
                color: '#2774bd',
                margin: 0,
                lineHeight: '1.3'
              }}
            >
              {regName}
            </h6>
            {/* Quick Stats */}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {metrics && metrics.totalLengthMiles ? (
                <>
                  <span style={{ marginRight: '12px' }} title="Existing + Planned + Envisioned + Design + gaps">
                    <strong>{metrics.totalLengthMiles}</strong> miles total
                  </span>
                  {metrics.percentageComplete && (
                    <span style={{ color: metrics.percentageComplete >= 50 ? '#28a745' : '#ffc107' }} title="(existing trails ÷ total) × 100">
                      <strong>{metrics.percentageComplete}%</strong> complete
                    </span>
                  )}
                </>
              ) : (
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  color: '#999',
                  fontStyle: 'italic'
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '10px' }}></i>
                  <span>Loading metrics...</span>
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onZoomToProject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onZoomToProject(regName);
                }}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#2774bd',
                  border: 'none',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e5a8a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2774bd';
                }}
                title={`Zoom to ${regName}`}
              >
                <i className="fas fa-search-plus"></i>
                Zoom
              </button>
            )}
            <button
              onClick={(e) => downloadTrailGeoJSON(regName, e)}
              className="btn btn-sm"
              style={{
                backgroundColor: '#28a745',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#218838';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#28a745';
              }}
              title={`Download ${regName} trails as GeoJSON`}
            >
              <i className="fas fa-download"></i>
              Download
            </button>
            <i 
              className="fas fa-chevron-down"
              style={{ 
                fontSize: '14px', 
                color: '#2774bd',
                transition: 'transform 0.3s',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            ></i>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div style={{ padding: '16px' }}>
            {/* Loading State */}
            {!metrics || !metrics.totalLengthMiles ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px',
                color: '#666',
                fontSize: '12px'
              }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '16px', marginBottom: '8px', display: 'block' }}></i>
                <span>Loading metrics...</span>
              </div>
            ) : (
              <>
            {/* Progress Bar */}
            {metrics.percentageComplete && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '2px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  <span>
                    <i className="fas fa-tasks" style={{ marginRight: '6px', color: '#2774bd' }}></i>
                    Completion Progress
                  </span>
                  <span style={{ color: '#2774bd' }}>{metrics.percentageComplete}%</span>
                </div>
                <div style={{ fontSize: '9px', color: '#999', marginBottom: '6px' }}>
                  (existing trails ÷ total) × 100
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${metrics.percentageComplete}%`,
                    height: '100%',
                    backgroundColor: metrics.percentageComplete >= 50 ? '#28a745' : '#ffc107',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            )}

            {/* Key Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#2774bd' }}>
                  {metrics.totalLengthMiles}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fas fa-route" style={{ fontSize: '10px' }}></i>
                    Total Miles
                  </span>
                  <span style={{ fontSize: '9px', color: '#999' }}>Existing + Planned + Envisioned + Design + gaps</span>
                </div>
              </div>
              {metrics.completedLengthMiles && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#28a745' }}>
                    {metrics.completedLengthMiles}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fas fa-check-circle" style={{ fontSize: '10px' }}></i>
                      Completed Miles
                    </span>
                    <span style={{ fontSize: '9px', color: '#999' }}>Existing trails</span>
                  </div>
                </div>
              )}
            </div>

            {/* Municipalities */}
            {metrics.municipalities && metrics.municipalities.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#333',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#2774bd' }}></i>
                  <span>Municipalities ({metrics.municipalities.length})</span>
                </div>
                <div 
                  style={{ 
                    fontSize: '12px', 
                    color: '#555',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: metrics.municipalities.length > 15 ? '120px' : 'none',
                    overflowY: metrics.municipalities.length > 15 ? 'auto' : 'visible',
                    padding: metrics.municipalities.length > 15 ? '8px' : '0',
                    backgroundColor: metrics.municipalities.length > 15 ? '#f8f9fa' : 'transparent',
                    borderRadius: '4px'
                  }}
                >
                  {metrics.municipalities.map((muni, muniIndex) => (
                    <span 
                      key={muniIndex}
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        backgroundColor: '#e7f3ff',
                        color: '#2774bd',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 500
                      }}
                    >
                      {muni}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Length by Type - Separated into Existing, Planned, and Gap */}
            {metrics.lengthByType && metrics.lengthByType.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#333',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="fas fa-ruler-combined" style={{ color: '#2774bd' }}></i>
                  <span>Length by Type</span>
                </div>
                
                {/* Existing Trails */}
                {metrics.lengthByType.filter(item => item.category === 'existing').length > 0 && (() => {
                  const existingItems = metrics.lengthByType.filter(item => item.category === 'existing');
                  const isExpanded = expandedLengthByType.get(regName)?.existing !== false;
                  return (
                    <div style={{ marginBottom: '12px' }}>
                      <div 
                        style={{ 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: '#2774bd',
                          marginBottom: isExpanded ? '6px' : '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'color 0.2s'
                        }}
                        onClick={() => toggleLengthByTypeSection(regName, 'existing')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#1e5a8a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#2774bd';
                        }}
                      >
                        <span>Existing</span>
                        <i 
                          className="fas fa-chevron-down"
                          style={{ 
                            fontSize: '10px', 
                            transition: 'transform 0.3s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        ></i>
                      </div>
                      {isExpanded && (
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          {existingItems.map((item, idx, filtered) => (
                            <div 
                              key={`existing-${idx}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                borderBottom: idx < filtered.length - 1 ? '1px solid #e9ecef' : 'none'
                              }}
                            >
                              <span>{item.type}</span>
                              <span style={{ fontWeight: 600, color: '#2774bd' }}>{item.miles} mi</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {/* Planned Trails */}
                {metrics.lengthByType.filter(item => item.category === 'planned').length > 0 && (() => {
                  const plannedItems = metrics.lengthByType.filter(item => item.category === 'planned');
                  const isExpanded = expandedLengthByType.get(regName)?.planned !== false;
                  return (
                    <div style={{ marginBottom: '12px' }}>
                      <div 
                        style={{ 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: '#6a1b9a',
                          marginBottom: isExpanded ? '6px' : '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'color 0.2s'
                        }}
                        onClick={() => toggleLengthByTypeSection(regName, 'planned')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4a148c';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6a1b9a';
                        }}
                      >
                        <span>Planned/Envisioned/Design</span>
                        <i 
                          className="fas fa-chevron-down"
                          style={{ 
                            fontSize: '10px', 
                            transition: 'transform 0.3s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        ></i>
                      </div>
                      {isExpanded && (
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          {plannedItems.map((item, idx, filtered) => (
                            <div 
                              key={`planned-${idx}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                borderBottom: idx < filtered.length - 1 ? '1px solid #e9ecef' : 'none'
                              }}
                            >
                              <span>{item.type}</span>
                              <span style={{ fontWeight: 600, color: '#6a1b9a' }}>{item.miles} mi</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {/* Gap Trails */}
                {metrics.lengthByType.filter(item => item.category === 'gap').length > 0 && (() => {
                  const gapItems = metrics.lengthByType.filter(item => item.category === 'gap');
                  const isExpanded = expandedLengthByType.get(regName)?.gap !== false;
                  return (
                    <div style={{ marginBottom: '12px' }}>
                      <div 
                        style={{ 
                          fontSize: '12px', 
                          fontWeight: 600, 
                          color: '#FF0000',
                          marginBottom: isExpanded ? '6px' : '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'color 0.2s'
                        }}
                        onClick={() => toggleLengthByTypeSection(regName, 'gap')}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#cc0000';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#FF0000';
                        }}
                      >
                        <span>Gap</span>
                        <i 
                          className="fas fa-chevron-down"
                          style={{ 
                            fontSize: '10px', 
                            transition: 'transform 0.3s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        ></i>
                      </div>
                      {isExpanded && (
                        <div style={{ fontSize: '12px', color: '#555' }}>
                          {gapItems.map((item, idx, filtered) => (
                            <div 
                              key={`gap-${idx}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                borderBottom: idx < filtered.length - 1 ? '1px solid #e9ecef' : 'none'
                              }}
                            >
                              <span>{item.type}</span>
                              <span style={{ fontWeight: 600, color: '#FF0000' }}>{item.miles} mi</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Parks */}
            {metrics.parks && metrics.parks.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#333',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="fas fa-tree" style={{ color: '#28a745' }}></i>
                  <span>Parks ({metrics.parks.length})</span>
                </div>
                <div style={{ fontSize: '12px', color: '#555' }}>
                  {metrics.parks.slice(0, 5).map((park, parkIndex) => (
                    <div key={parkIndex} style={{ padding: '4px 0' }}>
                      • {park}
                    </div>
                  ))}
                  {metrics.parks.length > 5 && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#666', 
                      fontStyle: 'italic',
                      marginTop: '4px'
                    }}>
                      + {metrics.parks.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trail Steward & Website */}
            {(metrics.steward || metrics.website) && (
              <div style={{ 
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '2px solid #e9ecef'
              }}>
                {metrics.steward && (
                  <div style={{ marginBottom: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-user-tie" style={{ color: '#2774bd', fontSize: '11px' }}></i>
                    <strong style={{ color: '#333' }}>Steward:</strong>{' '}
                    <span style={{ color: '#555' }}>{metrics.steward}</span>
                  </div>
                )}
                {metrics.website && (
                  <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-globe" style={{ color: '#2774bd', fontSize: '11px' }}></i>
                    <strong style={{ color: '#333' }}>Website:</strong>{' '}
                    <a 
                      href={metrics.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        color: '#2774bd', 
                        textDecoration: 'none',
                        wordBreak: 'break-all'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {metrics.website.length > 40 ? metrics.website.substring(0, 40) + '...' : metrics.website}
                    </a>
                  </div>
                )}
              </div>
            )}

              </>
            )}

          </div>
        )}
      </div>
    );
  };

  // Don't render if no projects are selected
  if (selectedProjectsMetrics.length === 0) {
    return null;
  }

  return (
    <div 
      className="ProjectMetricsPanel"
      style={{
        height: isPanelVisible ? undefined : '50px',
        transition: 'height 0.3s ease'
      }}
    >
      {isPanelVisible ? (
        <>
          <div 
            className="ProjectMetricsPanel__header"
            style={{ 
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              userSelect: 'none'
            }}
            onClick={() => setIsPanelVisible(false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(39, 116, 189, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            <h5 className="mb-0" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <i className="fas fa-chart-bar" style={{ fontSize: '18px' }}></i>
              <span>Regional Trails Metrics</span>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 400, 
                color: '#666',
                marginLeft: 'auto'
              }}>
                ({selectedProjectsMetrics.length})
              </span>
              <i 
                className="fas fa-chevron-down"
                style={{ 
                  fontSize: '14px', 
                  color: '#2774bd',
                  transition: 'transform 0.3s ease',
                  marginLeft: '8px'
                }}
                title="Collapse panel"
              ></i>
            </h5>
          </div>
          <div className="ProjectMetricsPanel__content">
            {selectedProjectsMetrics.map((projectItem, index) => 
              renderProjectMetrics(projectItem, index)
            )}
          </div>
        </>
      ) : (
        <div 
          className="ProjectMetricsPanel__header"
          style={{ 
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            userSelect: 'none',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '18px 20px'
          }}
          onClick={() => setIsPanelVisible(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(39, 116, 189, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          <h5 className="mb-0" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <i className="fas fa-chart-bar" style={{ fontSize: '18px' }}></i>
            <span>Regional Trails Metrics</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 400, 
              color: '#666',
              marginLeft: 'auto'
            }}>
              ({selectedProjectsMetrics.length})
            </span>
            <i 
              className="fas fa-chevron-up"
              style={{ 
                fontSize: '14px', 
                color: '#2774bd',
                transition: 'transform 0.3s ease',
                marginLeft: '8px'
              }}
              title="Expand panel"
            ></i>
          </h5>
        </div>
      )}
    </div>
  );
};

export default ProjectMetricsPanel;
