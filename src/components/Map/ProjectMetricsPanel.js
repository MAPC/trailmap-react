import React from "react";

const ProjectMetricsPanel = ({ 
  selectedRegNames = new Set(),
  projectMetrics = {}
}) => {
  // Reverse order so newest selected projects appear at the top
  const selectedProjectsMetrics = Array.from(selectedRegNames)
    .map(regName => ({
      regName,
      metrics: projectMetrics[regName]
    }))
    .filter(item => item.metrics)
    .reverse(); // Reverse to show newest at top

  // Render metrics for a single project
  const renderProjectMetrics = (projectItem, index) => {
    const { regName, metrics } = projectItem;
    
    return (
      <div 
        key={`metrics-${regName}-${index}`}
        className="mb-4 pb-3"
        style={{
          borderBottom: index < selectedProjectsMetrics.length - 1 ? '2px solid #dee2e6' : 'none'
        }}
      >
        <div className="mb-2">
          <h6 className="fw-bold mb-0" style={{ fontSize: '14px', color: '#2774bd' }}>
            {regName}
          </h6>
        </div>
        
        <div style={{ fontSize: '12px', marginLeft: '24px' }}>
          {/* Municipalities */}
          {metrics.municipalities && metrics.municipalities.length > 0 && (
            <div className="mb-2">
              <strong>Municipalities ({metrics.municipalities.length}):</strong>
              <div className="mt-1" style={{ fontSize: '11px', color: '#666' }}>
                {metrics.municipalities.map((muni, muniIndex) => (
                  <div key={muniIndex} className="mb-1">
                    • {muni}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Length */}
          <div className="mb-1">
            <strong>Total Length:</strong> {metrics.totalLengthMiles} miles
          </div>

          {/* Completed Length */}
          {metrics.completedLengthMiles && (
            <div className="mb-1">
              <strong>Completed:</strong> {metrics.completedLengthMiles} miles
            </div>
          )}

          {/* Percentage Complete */}
          {metrics.percentageComplete && (
            <div className="mb-1">
              <strong>Percentage Complete:</strong> {metrics.percentageComplete}%
            </div>
          )}

          {/* Length by Type */}
          {metrics.lengthByType && metrics.lengthByType.length > 0 && (
            <div className="mb-2">
              <strong>Length by Type:</strong>
              <div className="mt-1" style={{ fontSize: '11px', color: '#666' }}>
                {metrics.lengthByType.map((item, idx) => (
                  <div key={idx} className="mb-1">
                    • {item.type}: {item.miles} miles
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parks */}
          {metrics.parks && metrics.parks.length > 0 && (
            <div className="mb-2">
              <strong>Parks ({metrics.parks.length}):</strong>
              <div className="mt-1" style={{ fontSize: '11px', color: '#666' }}>
                {metrics.parks.map((park, parkIndex) => (
                  <div key={parkIndex} className="mb-1">
                    • {park}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trail Steward */}
          {metrics.steward && (
            <div className="mb-1">
              <strong>Trail Steward:</strong> {metrics.steward}
            </div>
          )}

          {/* Trail Website */}
          {metrics.website && (
            <div className="mb-1">
              <strong>Website:</strong>{' '}
              <a href={metrics.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2774bd', wordBreak: 'break-all', fontSize: '11px' }}>
                {metrics.website}
              </a>
            </div>
          )}

          {/* Key Gaps */}
          {metrics.gaps && metrics.gaps.length > 0 && (
            <div className="mb-2">
              <strong>Key Gaps ({metrics.gaps.length}):</strong>
              <div className="mt-1" style={{ fontSize: '11px', color: '#d9534f' }}>
                {metrics.gaps.map((gap, gapIndex) => (
                  <div key={gapIndex} className="mb-1">
                    • {gap.type}: {gap.lengthMiles} miles
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Don't render if no projects are selected
  if (selectedProjectsMetrics.length === 0) {
    return null;
  }

  return (
    <div className="ProjectMetricsPanel">
      <div className="ProjectMetricsPanel__header">
        <h5 className="mb-0">Project Metrics</h5>
      </div>
      <div className="ProjectMetricsPanel__content">
        {selectedProjectsMetrics.map((projectItem, index) => 
          renderProjectMetrics(projectItem, index)
        )}
      </div>
    </div>
  );
};

export default ProjectMetricsPanel;

