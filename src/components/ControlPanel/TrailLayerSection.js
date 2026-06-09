import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import TrailLayerRow from "./TrailLayerRow";

const TrailLayerSection = ({
  title,
  note,
  categories,
  layerType,
  activeLayerIds,
  onToggleLayer,
  onToggleAll,
  allLayerIds,
}) => {
  const [expanded, setExpanded] = useState(true);
  const allOn = allLayerIds.length > 0 && allLayerIds.every((id) => activeLayerIds.includes(id));
  const activeCount = activeLayerIds.length;

  const handleToggleAll = () => {
    onToggleAll(!allOn);
  };

  return (
    <section className="TrailLayerSection">
      <div className="TrailLayerSection__header">
        <div className="TrailLayerSection__header-main">
          <span className="TrailLayerSection__title">{title}</span>
          <span
            className="TrailLayerSection__count"
            aria-label={`${activeCount} active trail type${activeCount === 1 ? "" : "s"}`}
          >
            {activeCount}
          </span>
        </div>

        <div className="TrailLayerSection__header-actions">
          <button
            type="button"
            className="TrailLayerSection__collapse-btn"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          >
            <i className={`bi bi-chevron-${expanded ? "up" : "down"}`} aria-hidden="true" />
          </button>
          <Form.Check
            type="switch"
            id={`${layerType}-trails-master`}
            className="TrailLayerSection__master-switch"
            checked={allOn}
            onChange={handleToggleAll}
            aria-label={`Toggle all ${title.toLowerCase()}`}
          />
        </div>
      </div>

      {expanded && (
        <div className="TrailLayerSection__body">
          {note && <p className="TrailLayerSection__note">{note}</p>}
          {categories.map((category) => (
            <div key={category.title} className="TrailLayerSection__category">
              <span className="TrailLayerSection__category-title">{category.title}</span>
              {category.rows.map((row) => (
                <TrailLayerRow
                  key={row.id}
                  id={`${layerType}-${row.id}`}
                  label={row.label}
                  color={row.color}
                  dashed={row.dashed}
                  checked={activeLayerIds.includes(row.id)}
                  onChange={(checked) => onToggleLayer(row.id, checked)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TrailLayerSection;
