import React, { useState, useRef, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import * as turf from '@turf/turf';
import '../../styles/TrailListWindow.scss';

const TrailListWindow = ({ 
  municipalityTrails, 
  selectedMunicipality,
  selectedTrailIndex,
  onTrailClick,
  onClose
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [originalPosition, setOriginalPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [collapsedTypes, setCollapsedTypes] = useState({});
  const windowRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('TrailListWindow__header') || 
        e.target.closest('.TrailListWindow__header')) {
      setIsDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep window within viewport bounds
      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 100;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Save the current position as the original position when not collapsed
    if (!isCollapsed) {
      setOriginalPosition(position);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle positioning when collapsed/expanded
  useEffect(() => {
    if (isCollapsed) {
      // When collapsed, move to bottom of window
      const bottomY = window.innerHeight - 60; // 60px for header height
      setPosition(prev => ({ ...prev, y: bottomY }));
    } else {
      // When expanded, restore original position
      setPosition(originalPosition);
    }
  }, [isCollapsed, originalPosition]);

  // Handle window resize to keep collapsed window at bottom
  useEffect(() => {
    const handleResize = () => {
      if (isCollapsed) {
        const bottomY = window.innerHeight - 60;
        setPosition(prev => ({ ...prev, y: bottomY }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  const formatLength = (feet) => {
    const numFeet = Number(feet) || 0;
    return numFeet.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // Calculate trail density (total length / polygon area)
  const calculateTrailDensity = () => {
    if (!selectedMunicipality || !municipalityTrails || municipalityTrails.length === 0) {
      return { totalLength: 0, density: 0, area: 0 };
    }

    try {
      // Get municipality polygon
      const muniPolygon = turf.polygon(selectedMunicipality.geometry.coordinates);
      
      // Calculate polygon area in square feet
      const area = turf.area(muniPolygon) * 10.764; // Convert from sq meters to sq feet
      
      // Calculate total length of existing trails only
      let totalExistingLength = 0;
      let totalTrails = 0;

      municipalityTrails.forEach(trail => {
        const length = Number(trail.attributes?.length_ft || 
                             trail.attributes?.['Facility Length in Feet'] || 
                             trail.attributes?.Shape_Length || 0);
        
        if (length > 0) {
          totalTrails++;
          
          // Check if trail geometry exists and intersects with municipality
          if (trail.geometry && trail.geometry.coordinates) {
            let trailFeature;
            
            if (trail.geometry.type === 'LineString') {
              trailFeature = turf.lineString(trail.geometry.coordinates);
            } else if (trail.geometry.type === 'MultiLineString') {
              trailFeature = turf.multiLineString(trail.geometry.coordinates);
            }
            
            if (trailFeature) {
              // Calculate intersection
              const intersection = turf.intersect(trailFeature, muniPolygon);
              if (intersection) {
                const intersectionLength = turf.length(intersection, { units: 'feet' });
                totalExistingLength += intersectionLength;
              } else {
                // If no intersection, check if trail is completely within municipality
                const isWithin = turf.booleanWithin(trailFeature, muniPolygon);
                if (isWithin) {
                  totalExistingLength += length;
                }
              }
            }
          }
        }
      });

      // Calculate density: feet of trail per square mile
      const areaInSqMiles = area / 27878400; // Convert sq feet to sq miles
      const density = areaInSqMiles > 0 ? totalExistingLength / areaInSqMiles : 0;
      
      return {
        totalLength: totalExistingLength,
        totalTrails: totalTrails,
        area: area,
        density: Math.round(density * 10) / 10 // Round to 1 decimal place
      };
    } catch (error) {
      console.error('Error calculating trail density:', error);
      return { totalLength: 0, density: 0, area: 0 };
    }
  };

  const capitalizeWords = (str) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const toggleTypeCollapse = (typeName) => {
    setCollapsedTypes(prev => ({
      ...prev,
      [typeName]: !prev[typeName]
    }));
  };

  // Initialize all types as collapsed when municipality changes
  useEffect(() => {
    if (selectedMunicipality && municipalityTrails && municipalityTrails.length > 0) {
      const initialCollapsedState = {};
      
      // Group trails by type to get all type names
      const typeNames = new Set();
      municipalityTrails.forEach((trail) => {
        const type = trail.layerName || 'Unknown';
        typeNames.add(type);
      });
      
      // Set all types as collapsed by default
      typeNames.forEach(typeName => {
        initialCollapsedState[typeName] = true;
      });
      
      setCollapsedTypes(initialCollapsedState);
    }
  }, [selectedMunicipality, municipalityTrails]);

  if (!municipalityTrails || municipalityTrails.length === 0) {
    return null;
  }

  // Group trails by type
  const trailsByType = {};
  municipalityTrails.forEach((trail, idx) => {
    const type = trail.layerName || 'Unknown';
    if (!trailsByType[type]) {
      trailsByType[type] = {
        trails: [],
        color: trail.color
      };
    }
    trailsByType[type].trails.push({ ...trail, originalIndex: idx });
  });

  return (
    <div 
      ref={windowRef}
      className={`TrailListWindow ${isCollapsed ? 'TrailListWindow--collapsed' : ''} ${isDragging ? 'TrailListWindow--dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div 
        className="TrailListWindow__header"
        onMouseDown={handleMouseDown}
      >
        <div className="TrailListWindow__title">
          <span className="fw-bold">Trail List</span>
          {selectedMunicipality && (
            <span className="ms-2 text-muted small">
              {capitalizeWords(selectedMunicipality.name)} ({municipalityTrails.length})
            </span>
          )}
        </div>
        <div className="TrailListWindow__controls">
          <button
            className="TrailListWindow__control-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '▲' : '▼'}
          </button>
          <button
            className="TrailListWindow__control-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="TrailListWindow__body">
          <div className="TrailListWindow__trail-list">
            {Object.entries(trailsByType).map(([typeName, typeData]) => {
              const isTypeCollapsed = collapsedTypes[typeName];
              
              return (
                <div key={typeName} className="TrailListWindow__type-group">
                  <div 
                    className="TrailListWindow__type-header"
                    style={{
                      borderLeftColor: typeData.color,
                      borderLeftWidth: '4px',
                      borderLeftStyle: 'solid',
                      paddingLeft: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleTypeCollapse(typeName)}
                  >
                    <span className="fw-bold">{typeName}</span>
                    <span className="text-muted ms-2">({typeData.trails.length})</span>
                    <span className="ms-auto" style={{ fontSize: '12px' }}>
                      {isTypeCollapsed ? '▶' : '▼'}
                    </span>
                  </div>
                  
                  {!isTypeCollapsed && typeData.trails.map((trail) => (
                  <div 
                    key={trail.originalIndex}
                    className={`TrailListWindow__trail-item ${
                      selectedTrailIndex === trail.originalIndex ? 'TrailListWindow__trail-item--selected' : ''
                    }`}
                    onClick={() => {
                      if (onTrailClick) {
                        onTrailClick(trail, trail.originalIndex);
                      }
                    }}
                  >
                    <div className="TrailListWindow__trail-name">
                      {trail.attributes?.Trail_Name || 
                       trail.attributes?.TRAILNAME || 
                       trail.attributes?.['Local Name'] || 
                       trail.attributes?.['Regional Name'] || 
                       trail.attributes?.local_name ||
                       'Unnamed Trail'}
                    </div>
                    <div className="TrailListWindow__trail-meta">
                      {(trail.attributes?.length_ft || trail.attributes?.['Facility Length in Feet'] || trail.attributes?.Shape_Length) && (
                        <span className="TrailListWindow__trail-length">
                          {formatLength(
                            trail.attributes?.length_ft || 
                            trail.attributes?.['Facility Length in Feet'] || 
                            trail.attributes?.Shape_Length || 
                            0
                          )} ft
                        </span>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailListWindow;

