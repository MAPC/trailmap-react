import React, { useState, useRef, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./BufferAnalysisWindow.scss";

const BufferAnalysisWindow = ({ 
  show,
  onClose,
  bufferResults,
  bufferRadius,
  onRadiusChange,
  isBufferActive,
  onActivateBuffer,
  bufferCenter,
  selectedMunicipality
}) => {
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const windowRef = useRef(null);

  const MAX_RADIUS = 1500; // 1500 meters = ~0.93 miles

  // Reset position when municipality changes
  useEffect(() => {
    if (selectedMunicipality) {
      setPosition({ x: 20, y: 100 });
      setIsCollapsed(false);
    }
  }, [selectedMunicipality]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.BufferAnalysisWindow__header') && 
        !e.target.closest('.BufferAnalysisWindow__close') &&
        !e.target.closest('.BufferAnalysisWindow__collapse')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const formatDistance = (meters) => {
    if (!meters && meters !== 0) return "N/A";
    
    const feet = meters * 3.28084;
    
    if (feet < 5280) {
      return `${Math.round(feet).toLocaleString()} ft`;
    } else {
      const miles = feet / 5280;
      return `${miles.toFixed(2)} mi`;
    }
  };

  const formatDistanceMeters = (meters) => {
    if (!meters && meters !== 0) return "N/A";
    
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      const km = meters / 1000;
      return `${km.toFixed(2)} km`;
    }
  };

  if (!show) return null;

  return (
    <div
      ref={windowRef}
      className={`BufferAnalysisWindow ${isCollapsed ? 'BufferAnalysisWindow--collapsed' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header */}
      <div 
        className="BufferAnalysisWindow__header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center">
            <span className="fw-bold">Buffer Analysis</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <button
              className="BufferAnalysisWindow__collapse btn btn-sm p-0"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? '▲' : '▼'}
            </button>
            <button
              className="BufferAnalysisWindow__close btn btn-sm p-0"
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="BufferAnalysisWindow__body">
          {/* Controls Section */}
          <div className="BufferAnalysisWindow__controls mb-3">
            <div className="small fw-semibold mb-2">Create Buffer Zone</div>
            
            <Form.Group className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="small mb-0">
                  Radius: <strong>{bufferRadius}m</strong>
                </Form.Label>
                <span className="small text-muted">{formatDistance(bufferRadius)}</span>
              </div>
              <Form.Range
                min="100"
                max={MAX_RADIUS}
                step="100"
                value={bufferRadius}
                onChange={(e) => onRadiusChange(parseInt(e.target.value))}
                size="sm"
              />
              <div className="d-flex justify-content-between small text-muted" style={{ fontSize: '0.7rem' }}>
                <span>100m</span>
                <span>{MAX_RADIUS}m</span>
              </div>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                variant={isBufferActive ? "danger" : "success"}
                size="sm"
                className="flex-grow-1"
                onClick={() => {
                  console.log('🖱️ Buffer button clicked. Current state:', { isBufferActive, bufferCenter });
                  onActivateBuffer();
                }}
              >
                {isBufferActive ? "Cancel Drawing" : bufferCenter ? "Draw New Buffer" : "Click to Start Drawing"}
              </Button>
              {bufferCenter && !isBufferActive && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onActivateBuffer(true)} // Clear
                  title="Clear buffer"
                >
                  ✕
                </Button>
              )}
            </div>

            {isBufferActive && (
              <div className="alert alert-success mt-2 mb-0 p-2 small">
                <div className="d-flex align-items-center">
                  <div>
                    <strong>Drawing Mode Active!</strong><br/>
                    Click anywhere on the map to draw a {bufferRadius}m radius circle
                  </div>
                </div>
              </div>
            )}
            
            {!isBufferActive && !bufferCenter && (
              <div className="alert alert-light mt-2 mb-0 p-2 small border">
                <div className="text-muted small">
                  💡 Adjust the radius above, then click "Start Drawing" to create a buffer zone
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {bufferResults && bufferCenter && (
            <div className="BufferAnalysisWindow__results">
              <div className="small fw-semibold mb-2">Analysis Results</div>
              
              {/* Buffer Center */}
              <div className="BufferAnalysisWindow__center mb-2 p-2 border rounded bg-light">
                <div className="small text-muted">Buffer Center</div>
                <code className="small">
                  {bufferCenter.lat.toFixed(6)}, {bufferCenter.lng.toFixed(6)}
                </code>
              </div>

              {/* Summary Stats */}
              <div className="BufferAnalysisWindow__summary mb-3 p-2 border rounded">
                <div className="row g-2 small">
                  <div className="col-3 text-center">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Trails</div>
                    <div className="fw-bold fs-5">{bufferResults.trails.length}</div>
                  </div>
                  <div className="col-3 text-center">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Rail Stations</div>
                    <div className="fw-bold fs-5">{bufferResults.stations.length}</div>
                  </div>
                  <div className="col-3 text-center">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Bike Stations</div>
                    <div className="fw-bold fs-5">{bufferResults.bikeStations ? bufferResults.bikeStations.length : 0}</div>
                  </div>
                  <div className="col-3 text-center">
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Area</div>
                    <div className="fw-bold" style={{ fontSize: '0.8rem' }}>
                      {((Math.PI * Math.pow(bufferRadius, 2)) / 1000000).toFixed(2)} km²
                    </div>
                  </div>
                </div>
              </div>

              {/* Trails by Type */}
              <div className="mb-3">
                <div className="small fw-semibold mb-2">Trail Types (Counts)</div>
                {bufferResults.trails.length === 0 ? (
                  <div className="small text-muted text-center p-2 border rounded">
                    No trails found
                  </div>
                ) : (
                  <div className="BufferAnalysisWindow__trail-types">
                    {(() => {
                      // Group trails by type
                      const trailsByType = {};
                      bufferResults.trails.forEach((trail) => {
                        if (!trailsByType[trail.type]) {
                          trailsByType[trail.type] = {
                            count: 0,
                            color: trail.color
                          };
                        }
                        trailsByType[trail.type].count++;
                      });

                      return Object.entries(trailsByType)
                        .sort(([, a], [, b]) => b.count - a.count)
                        .map(([type, data]) => (
                          <div key={type} className="BufferAnalysisWindow__type-badge">
                            <div className="type-name small text-muted mb-1" title={type}>
                              {type}
                            </div>
                            <div 
                              className="type-circle d-flex align-items-center justify-content-center fw-bold"
                              style={{ 
                                backgroundColor: data.color || '#6c757d',
                                color: '#ffffff'
                              }}
                              title={`${data.count} ${type} trails`}
                            >
                              {data.count}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                )}
              </div>

              {/* Commuter Rail Stations in Buffer */}
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-semibold">Commuter Rail Stations ({bufferResults.stations.length})</span>
                </div>
                {bufferResults.stations.length === 0 ? (
                  <div className="small text-muted text-center p-2 border rounded">
                    No stations found
                  </div>
                ) : (
                  <div className="BufferAnalysisWindow__list">
                    {bufferResults.stations.slice(0, 5).map((station, idx) => (
                      <div key={idx} className="BufferAnalysisWindow__item p-2 mb-1 border rounded">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="small fw-semibold text-truncate" title={station.name}>
                              {station.name}
                            </div>
                            <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                              {station.line}
                            </div>
                          </div>
                          <div className="text-end ms-2" style={{ minWidth: '60px' }}>
                            <div className="small fw-bold text-primary" style={{ fontSize: '0.75rem' }}>
                              {formatDistanceMeters(station.distance)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {bufferResults.stations.length > 5 && (
                      <div className="small text-muted text-center">
                        +{bufferResults.stations.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Blue Bike Stations in Buffer */}
              {bufferResults.bikeStations && bufferResults.bikeStations.length > 0 && (
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-semibold">Blue Bike Stations ({bufferResults.bikeStations.length})</span>
                  </div>
                  <div className="BufferAnalysisWindow__list BufferAnalysisWindow__bike-stations">
                    {bufferResults.bikeStations.map((station, idx) => (
                      <div key={idx} className="BufferAnalysisWindow__item p-2 mb-1 border rounded">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="small fw-semibold text-truncate" title={station.name}>
                              {station.name}
                            </div>
                            <div className="small text-muted" style={{ fontSize: '0.7rem' }}>
                              {station.district} • {station.totalDocks} docks
                            </div>
                          </div>
                          <div className="text-end ms-2" style={{ minWidth: '60px' }}>
                            <div className="small fw-bold text-primary" style={{ fontSize: '0.75rem' }}>
                              {formatDistanceMeters(station.distance)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State - removed as we now show instructions in controls */}
        </div>
      )}
    </div>
  );
};

export default BufferAnalysisWindow;

