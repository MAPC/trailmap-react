import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import '../../styles/TrailLegend.scss';
import { geojsonTrailLayers, TRAIL_STATUS } from './constants/geojsonTrailLayers';

const TrailLegend = ({
  visibleTrailTypes,
  onToggleTrailType,
  readOnly = false,
  hideHeader = false,
}) => {
  // If no visibility state provided, show all by default
  const isVisible = (layerId) => {
    if (!visibleTrailTypes) return true;
    return visibleTrailTypes[layerId] !== false;
  };

  const handleClick = (layerId) => {
    if (readOnly || !onToggleTrailType) return;
    onToggleTrailType(layerId);
  };

  const existingTrails = geojsonTrailLayers.filter(
    (layer) => layer.status === TRAIL_STATUS.EXISTING
  );
  const plannedTrails = geojsonTrailLayers.filter(
    (layer) => layer.status === TRAIL_STATUS.PLANNED
  );
  const proposedTrails = geojsonTrailLayers.filter(
    (layer) => layer.status === TRAIL_STATUS.PROPOSED
  );

  const renderTrailItem = (layer) => {
    const visible = readOnly ? true : isVisible(layer.id);
    return (
      <div 
        key={layer.id} 
        className={`TrailLegend__item${readOnly ? " TrailLegend__item--readonly" : ""}`}
        onClick={() => handleClick(layer.id)}
        style={{
          cursor: readOnly ? 'default' : 'pointer',
          opacity: visible ? 1 : 0.4,
          backgroundColor: visible ? 'transparent' : 'rgba(0, 0, 0, 0.05)',
          padding: '4px',
          borderRadius: '4px',
          transition: readOnly ? 'none' : 'all 0.2s ease'
        }}
        onMouseEnter={readOnly ? undefined : (e) => {
          e.currentTarget.style.backgroundColor = visible ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={readOnly ? undefined : (e) => {
          e.currentTarget.style.backgroundColor = visible ? 'transparent' : 'rgba(0, 0, 0, 0.05)';
        }}
      >
        {!readOnly && (
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id={`trail-legend-eye-${layer.id}`}>
                {visible ? "Hide on map" : "Show on map"}
              </Tooltip>
            }
          >
            <div 
              className="TrailLegend__icon"
              style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                color: visible ? '#666' : '#999'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(layer.id);
              }}
            >
              <i className={visible ? "fas fa-eye" : "fas fa-eye-slash"} aria-hidden="true" />
            </div>
          </OverlayTrigger>
        )}
        <div className="TrailLegend__line-container">
          <svg width="40" height="3" className="TrailLegend__line">
            <line
              x1="0"
              y1="1.5"
              x2="40"
              y2="1.5"
              stroke={layer.color}
              strokeWidth="3"
              strokeDasharray={layer.dashArray ? layer.dashArray.join(' ') : "0"}
              opacity={visible ? 1 : 0.4}
            />
          </svg>
        </div>
        <span className="TrailLegend__label" style={{ opacity: visible ? 1 : 0.4 }}>
          {layer.name.replace(/^(Existing|Planned|Proposed)\s+/, "")}
        </span>
      </div>
    );
  };

  return (
    <div className="TrailLegend">
      {!hideHeader && (
        <div className="TrailLegend__header">
          <strong>Trail Types</strong>
        </div>
      )}

      {/* Existing Trails Section */}
      <div className="TrailLegend__section">
        <div className="TrailLegend__section-header">
          <strong style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Existing</strong>
        </div>
        <div className="TrailLegend__items">
          {existingTrails.map(layer => renderTrailItem(layer))}
        </div>
      </div>

      {/* Planned Trails Section */}
      {plannedTrails.length > 0 && (
        <div className="TrailLegend__section">
          <div className="TrailLegend__section-header">
            <strong style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Planned</strong>
          </div>
          <div className="TrailLegend__items">
            {plannedTrails.map(layer => renderTrailItem(layer))}
          </div>
        </div>
      )}

      {/* Proposed Trails Section */}
      {proposedTrails.length > 0 && (
        <div className="TrailLegend__section">
          <div className="TrailLegend__section-header">
            <strong style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Proposed</strong>
          </div>
          <div className="TrailLegend__items">
            {proposedTrails.map(layer => renderTrailItem(layer))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailLegend;

