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

  const handleToggleAll = () => {
    onToggleAll(!allOn);
  };

  return (
    <section className="TrailLayerSection">
      <div className="TrailLayerSection__header">
        <button
          type="button"
          className="TrailLayerSection__title-btn"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          <span className="TrailLayerSection__title">{title}</span>
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
