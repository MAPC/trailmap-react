import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import "./BufferAnalysis.scss";

const BufferAnalysis = ({ 
  show, 
  onHide, 
  bufferResults,
  bufferRadius,
  onRadiusChange,
  onActivateBuffer,
  isBufferActive,
  bufferCenter
}) => {
  const MAX_RADIUS = 5000; // 5000 meters = ~3.1 miles

  const formatDistance = (meters) => {
    if (!meters && meters !== 0) return "N/A";
    
    // Convert to feet
    const feet = meters * 3.28084;
    
    if (feet < 5280) {
      return `${Math.round(feet).toLocaleString()} ft`;
    } else {
      const miles = feet / 5280;
      return `${miles.toFixed(2)} mi`;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Buffer Analysis</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Buffer Controls */}
        <div className="BufferAnalysis__controls mb-4">
          <h6 className="fw-bold mb-3">Create Buffer Zone</h6>
          
          <Form.Group className="mb-3">
            <Form.Label className="small">
              Buffer Radius: <strong>{bufferRadius}m</strong> ({formatDistance(bufferRadius)})
            </Form.Label>
            <Form.Range
              min="100"
              max={MAX_RADIUS}
              step="100"
              value={bufferRadius}
              onChange={(e) => onRadiusChange(parseInt(e.target.value))}
              disabled={!isBufferActive}
            />
            <div className="d-flex justify-content-between small text-muted">
              <span>100m</span>
              <span>{MAX_RADIUS}m (~3.1 mi)</span>
            </div>
          </Form.Group>

          <div className="d-flex gap-2">
            <Button
              variant={isBufferActive ? "danger" : "primary"}
              size="sm"
              onClick={onActivateBuffer}
            >
              {isBufferActive ? "Cancel" : "Click Map to Create Buffer"}
            </Button>
            {bufferCenter && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => onActivateBuffer()} // Deactivate
              >
                Clear Buffer
              </Button>
            )}
          </div>

          {isBufferActive && (
            <div className="alert alert-info mt-3 mb-0 small">
              📍 Click anywhere on the map to create a buffer zone
            </div>
          )}
        </div>

        {/* Results */}
        {bufferResults && bufferCenter && (
          <div className="BufferAnalysis__results">
            <h6 className="fw-bold mb-3">Analysis Results</h6>
            
            <div className="BufferAnalysis__center mb-3 p-2 border rounded bg-light">
              <small className="text-muted d-block">Buffer Center</small>
              <code className="small">
                {bufferCenter.lat.toFixed(6)}, {bufferCenter.lng.toFixed(6)}
              </code>
            </div>

            {/* Trails in Buffer */}
            <div className="mb-4">
              <h6 className="fw-semibold mb-2">
                🚴 Trails in Buffer ({bufferResults.trails.length})
              </h6>
              {bufferResults.trails.length === 0 ? (
                <p className="small text-muted">No trails found within buffer</p>
              ) : (
                <div className="BufferAnalysis__list">
                  {bufferResults.trails.map((trail, idx) => (
                    <div key={idx} className="BufferAnalysis__item p-2 mb-2 border rounded">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold small">{trail.name}</div>
                          <div className="small text-muted">{trail.type}</div>
                        </div>
                        <div className="text-end">
                          <div className="small fw-bold text-primary">
                            {formatDistance(trail.distance)}
                          </div>
                          <div className="small text-muted">from center</div>
                        </div>
                      </div>
                      {trail.length && (
                        <div className="small text-muted mt-1">
                          Length: {formatDistance(trail.length)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commuter Rail Stations in Buffer */}
            <div className="mb-4">
              <h6 className="fw-semibold mb-2">
                🚆 Commuter Rail Stations ({bufferResults.stations.length})
              </h6>
              {bufferResults.stations.length === 0 ? (
                <p className="small text-muted">No stations found within buffer</p>
              ) : (
                <div className="BufferAnalysis__list">
                  {bufferResults.stations.map((station, idx) => (
                    <div key={idx} className="BufferAnalysis__item p-2 mb-2 border rounded">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold small">{station.name}</div>
                          <div className="small text-muted">{station.line}</div>
                        </div>
                        <div className="text-end">
                          <div className="small fw-bold text-primary">
                            {formatDistance(station.distance)}
                          </div>
                          <div className="small text-muted">from center</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="BufferAnalysis__summary p-3 border rounded bg-light">
              <h6 className="fw-semibold mb-2">Summary</h6>
              <div className="row">
                <div className="col-6">
                  <div className="small text-muted">Total Trails</div>
                  <div className="fw-bold">{bufferResults.trails.length}</div>
                </div>
                <div className="col-6">
                  <div className="small text-muted">Total Stations</div>
                  <div className="fw-bold">{bufferResults.stations.length}</div>
                </div>
                <div className="col-12 mt-2">
                  <div className="small text-muted">Buffer Area</div>
                  <div className="fw-bold">
                    {((Math.PI * Math.pow(bufferRadius, 2)) / 1000000).toFixed(2)} km²
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BufferAnalysis;

