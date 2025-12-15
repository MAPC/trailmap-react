import React from 'react';
import '../../styles/TrailLegend.scss';

const TrailLegend = () => {
  // Trail types with their colors and line styles
  const trailTypes = [
    { name: "Protected Bike Lanes", color: "#2166AC", isDashed: false },
    { name: "Planned Protected Bike Lanes", color: "#2166AC", isDashed: true },
    { name: "Bike Lanes", color: "#92C5DE", isDashed: false },
    { name: "Planned Bike Lanes", color: "#92C5DE", isDashed: true },
    { name: "Paved Foot Path", color: "#903366", isDashed: false },
    { name: "Planned Paved Foot Path", color: "#903366", isDashed: true },
    { name: "Natural Surface Path", color: "#A87196", isDashed: false },
    { name: "Planned Natural Surface Path", color: "#A87196", isDashed: true },
    { name: "Paved Shared Use", color: "#214A2D", isDashed: false },
    { name: "Planned Paved Shared Use", color: "#214A2D", isDashed: true },
    { name: "Unimproved Shared Use", color: "#4BAA40", isDashed: false },
    { name: "Planned Unimproved Shared Use", color: "#4BAA40", isDashed: true }
  ];

  return (
    <div className="TrailLegend">
      <div className="TrailLegend__header">
        <strong>Trail Types</strong>
      </div>
      <div className="TrailLegend__items">
        {trailTypes.map((trail, index) => (
          <div key={index} className="TrailLegend__item">
            <div className="TrailLegend__line-container">
              <svg width="40" height="3" className="TrailLegend__line">
                <line
                  x1="0"
                  y1="1.5"
                  x2="40"
                  y2="1.5"
                  stroke={trail.color}
                  strokeWidth="3"
                  strokeDasharray={trail.isDashed ? "4 2" : "0"}
                />
              </svg>
            </div>
            <span className="TrailLegend__label">{trail.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailLegend;

