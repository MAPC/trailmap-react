import React, { useContext, useMemo } from "react";
import { LayerContext } from "../../App";
import CollapsibleTrailLegend from "./CollapsibleTrailLegend";
import {
  TRAIL_LAYER_CATEGORIES,
  LANDLINE_SWATCH_COLOR,
  getLayerColor,
} from "../ControlPanel/trailLayerConfig";

const MapLegend = ({ controlPanelOpen = false, defaultOpen = true }) => {
  const {
    trailLayers,
    proposedLayers,
    showLandlineLayer,
    existingTrails,
    proposedTrails,
  } = useContext(LayerContext);

  const { existingItems, plannedItems, landlineItem } = useMemo(() => {
    const existing = [];
    const planned = [];

    TRAIL_LAYER_CATEGORIES.forEach((category) => {
      category.items.forEach((item) => {
        if (trailLayers.includes(item.existingId)) {
          existing.push({
            key: item.existingId,
            label: item.label,
            color: getLayerColor(existingTrails, item.existingId),
          });
        }
        if (proposedLayers.includes(item.proposedId)) {
          planned.push({
            key: item.proposedId,
            label: item.label,
            color: getLayerColor(proposedTrails, item.proposedId),
          });
        }
      });
    });

    const landline = showLandlineLayer
      ? {
          key: "landline",
          label: "LandLine Regional Greenway",
          color: LANDLINE_SWATCH_COLOR,
        }
      : null;

    return {
      existingItems: existing,
      plannedItems: planned,
      landlineItem: landline,
    };
  }, [
    trailLayers,
    proposedLayers,
    showLandlineLayer,
    existingTrails,
    proposedTrails,
  ]);

  const hasLegendContent =
    existingItems.length > 0 || plannedItems.length > 0 || landlineItem;

  if (!hasLegendContent) {
    return null;
  }

  const renderItem = (item, dashed = false) => (
    <li key={item.key} className="MapTrailLegend__item">
      <span
        className={`MapTrailLegend__swatch${
          dashed ? " MapTrailLegend__swatch--dashed" : ""
        }`}
        style={{ "--swatch-color": item.color }}
        aria-hidden="true"
      />
      <span className="MapTrailLegend__label">{item.label}</span>
    </li>
  );

  const renderSection = (title, items, dashed = false) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="MapTrailLegend__section">
        <h4 className="MapTrailLegend__section-title">{title}</h4>
        <ul className="MapTrailLegend__list">{items.map((item) => renderItem(item, dashed))}</ul>
      </div>
    );
  };

  return (
    <CollapsibleTrailLegend
      label="Legend"
      controlPanelOpen={controlPanelOpen}
      defaultOpen={defaultOpen}
    >
      {renderSection("Existing", existingItems)}
      {renderSection("Planned", plannedItems, true)}
      {landlineItem && (
        <div className="MapTrailLegend__section">
          <h4 className="MapTrailLegend__section-title">Other</h4>
          <ul className="MapTrailLegend__list">{renderItem(landlineItem)}</ul>
        </div>
      )}
    </CollapsibleTrailLegend>
  );
};

export default MapLegend;
