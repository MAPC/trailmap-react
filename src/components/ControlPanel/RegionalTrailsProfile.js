import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { LayerContext } from "../../App";

// Major trails list - these names should match grouped_reg_name values in export_major_trails FeatureServer
// Sorted alphabetically A to Z
const MAJOR_TRAILS = [
  "Bay Circuit",
  "Bruce Freeman",
  "Charles River Greenway",
  "Minuteman",
  "Neponset River",
  "Northern Strand"
].sort();

const RegionalTrailsProfile = ({ 
  regNames = [],
  selectedRegNames = new Set(),
  onToggleRegName,
  selectedMajorTrails = [],
  onToggleMajorTrail
}) => {
  const { basemaps } = useContext(LayerContext);

  // Check if a major trail is selected (check selectedMajorTrails array)
  const isMajorTrailSelected = (majorTrail) => {
    return selectedMajorTrails.includes(majorTrail);
  };

  const handleProjectToggle = (regName) => {
    if (onToggleRegName) {
      onToggleRegName(regName);
    }
  };

  const handleMajorTrailToggle = (majorTrail) => {
    if (onToggleMajorTrail) {
      // Use the major trail toggle handler - directly queries export_major_trails FeatureServer
      onToggleMajorTrail(majorTrail);
    }
  };

  return (
    <div className="RegionalTrailsProfile">
      {regNames.length === 0 ? (
        <div className="text-muted small">
          <p>Loading projects...</p>
        </div>
      ) : (
        <>
          {/* Major Trails Projects List */}
          <div className="mb-3">
            <Form.Label className="small fw-semibold d-block mb-2">Major regional trails</Form.Label>
            <div className="project-list" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
              {MAJOR_TRAILS.map((majorTrail) => {
                  const isSelected = isMajorTrailSelected(majorTrail);
                  
                  return (
                    <div
                      key={majorTrail}
                      className="project-item mb-2 p-2 rounded"
                      style={{
                        backgroundColor: isSelected ? 'rgba(59, 131, 199, 0.1)' : 'transparent',
                        border: isSelected ? '2px solid rgba(59, 131, 199, 0.5)' : '1px solid #ddd',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleMajorTrailToggle(majorTrail)}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`major-trail-checkbox-${majorTrail}`}
                        checked={isSelected}
                        onChange={() => handleMajorTrailToggle(majorTrail)}
                        label={
                          <span className="project-name" style={{ fontSize: '14px', fontWeight: isSelected ? 600 : 400 }}>
                            {majorTrail}
                          </span>
                        }
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Other Trails Project List */}
          {regNames.length > 0 && (
            <div className="mb-3">
              <Form.Label className="small fw-semibold d-block mb-2">Other regional trails</Form.Label>
              <div className="project-list" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                {regNames.map((regName, index) => {
                  const isSelected = selectedRegNames.has(regName);
                  
                  return (
                    <div
                      key={index}
                      className="project-item mb-2 p-2 rounded"
                      style={{
                        backgroundColor: isSelected ? 'rgba(59, 131, 199, 0.1)' : 'transparent',
                        border: isSelected ? '2px solid rgba(59, 131, 199, 0.5)' : '1px solid #ddd',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleProjectToggle(regName)}
                    >
                      <Form.Check
                        type="checkbox"
                        id={`project-checkbox-${index}`}
                        checked={isSelected}
                        onChange={() => handleProjectToggle(regName)}
                        label={
                          <span className="project-name" style={{ fontSize: '14px' }}>
                            {regName}
                          </span>
                        }
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RegionalTrailsProfile;
