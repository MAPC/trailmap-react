import React, { useState, useEffect, useContext } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { LayerContext } from "../../App";

const ProjectTrailsProfile = ({ 
  regNames = [],
  selectedRegNames = new Set(),
  onToggleRegName
}) => {
  const { basemaps } = useContext(LayerContext);

  const handleProjectToggle = (regName) => {
    if (onToggleRegName) {
      onToggleRegName(regName);
    }
  };

  return (
    <div className="ProjectTrailsProfile">
      {/* Project List */}
      {regNames.length === 0 ? (
        <div className="text-muted small">
          <p>Loading projects...</p>
        </div>
      ) : (
        <div className="project-list" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '5px' }}>
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
      )}
    </div>
  );
};

export default ProjectTrailsProfile;

