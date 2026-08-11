import React, { useContext, useMemo } from "react";
import { LayerContext } from "../../App";
import CollapsibleTrailLegend from "./CollapsibleTrailLegend";
import {
  TRAIL_LAYER_CATEGORIES,
  getLandlineLegendItems,
  getLayerColor,
  getLayerLabel,
} from "../ControlPanel/trailLayerConfig";

const TrailSwatch = ({ color, dashed = false }) => (
  <span
    className={`MapTrailLegend__swatch${dashed ? " MapTrailLegend__swatch--dashed" : ""}`}
    style={{ "--swatch-color": color }}
    aria-hidden="true"
  />
);

/** SVG preview built from the same stroke paints used on the map. */
const LandlineSwatch = ({ item }) => {
  const strokes = item.previewStrokes?.length
    ? item.previewStrokes
    : [{ color: item.color, width: 3, dasharray: item.dashed ? "6 4" : null }];

  const height = item.doubleLine ? 14 : item.hasCasing ? 12 : 10;
  const midY = height / 2;

  return (
    <svg
      className="MapTrailLegend__swatchSvg"
      width="40"
      height={height}
      viewBox={`0 0 40 ${height}`}
      aria-hidden="true"
    >
      {strokes.map((stroke, index) => {
        let y = midY;
        if (item.doubleLine && strokes.length > 1) {
          y = midY + (index === 0 ? -3 : 3);
        }

        return (
          <line
            key={`${item.key}-${index}`}
            x1="1"
            y1={y}
            x2="39"
            y2={y}
            stroke={stroke.color}
            strokeWidth={Math.min(7, Math.max(1.5, stroke.width || 3))}
            strokeLinecap="round"
            strokeDasharray={stroke.dasharray || undefined}
          />
        );
      })}
    </svg>
  );
};

const MapLegend = ({ controlPanelOpen = false, defaultOpen = true }) => {
  const {
    trailLayers,
    proposedLayers,
    showLandlineLayer,
    existingTrails,
    proposedTrails,
    landlines,
  } = useContext(LayerContext);

  const { existingItems, plannedItems, landlineItems } = useMemo(() => {
    const existing = [];
    const planned = [];

    TRAIL_LAYER_CATEGORIES.forEach((category) => {
      category.items.forEach((item) => {
        if (trailLayers.includes(item.existingId)) {
          existing.push({
            key: item.existingId,
            label: getLayerLabel(existingTrails, item.existingId),
            color: getLayerColor(existingTrails, item.existingId),
          });
        }
        if (proposedLayers.includes(item.proposedId)) {
          planned.push({
            key: item.proposedId,
            label: getLayerLabel(proposedTrails, item.proposedId),
            color: getLayerColor(proposedTrails, item.proposedId),
          });
        }
      });
    });

    return {
      existingItems: existing,
      plannedItems: planned,
      landlineItems: showLandlineLayer ? getLandlineLegendItems(landlines) : [],
    };
  }, [
    trailLayers,
    proposedLayers,
    showLandlineLayer,
    existingTrails,
    proposedTrails,
    landlines,
  ]);

  const hasLegendContent =
    existingItems.length > 0 || plannedItems.length > 0 || landlineItems.length > 0;

  if (!hasLegendContent) {
    return null;
  }

  const renderTrailItem = (item, dashed = false) => (
    <li key={item.key} className="MapTrailLegend__item">
      <TrailSwatch color={item.color} dashed={dashed || item.dashed} />
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
        <ul className="MapTrailLegend__list">
          {items.map((item) => renderTrailItem(item, dashed))}
        </ul>
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
      {landlineItems.length > 0 && (
        <div className="MapTrailLegend__section">
          <h4 className="MapTrailLegend__section-title">LandLine</h4>
          <ul className="MapTrailLegend__list">
            {landlineItems.map((item) => (
              <li key={item.key} className="MapTrailLegend__item">
                <LandlineSwatch item={item} />
                <span className="MapTrailLegend__label">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CollapsibleTrailLegend>
  );
};

export default MapLegend;
