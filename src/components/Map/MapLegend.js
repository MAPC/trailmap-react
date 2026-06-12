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

  const legendItems = useMemo(() => {
    const items = [];

    TRAIL_LAYER_CATEGORIES.forEach((category) => {
      category.items.forEach((item) => {
        if (trailLayers.includes(item.existingId)) {
          items.push({
            key: item.existingId,
            label: item.label,
            color: getLayerColor(existingTrails, item.existingId),
            dashed: false,
          });
        }
        if (proposedLayers.includes(item.proposedId)) {
          items.push({
            key: item.proposedId,
            label: item.label,
            color: getLayerColor(proposedTrails, item.proposedId),
            dashed: true,
          });
        }
      });
    });

    if (showLandlineLayer) {
      items.push({
        key: "landline",
        label: "LandLine Regional Greenway",
        color: LANDLINE_SWATCH_COLOR,
        dashed: false,
      });
    }

    return items;
  }, [
    trailLayers,
    proposedLayers,
    showLandlineLayer,
    existingTrails,
    proposedTrails,
  ]);

  if (legendItems.length === 0) {
    return null;
  }

  return (
    <CollapsibleTrailLegend
      controlPanelOpen={controlPanelOpen}
      defaultOpen={defaultOpen}
    >
      <ul className="MapTrailLegend__list">
        {legendItems.map((item) => (
          <li key={item.key} className="MapTrailLegend__item">
            <span
              className={`MapTrailLegend__swatch${
                item.dashed ? " MapTrailLegend__swatch--dashed" : ""
              }`}
              style={{ "--swatch-color": item.color }}
              aria-hidden="true"
            />
            <span className="MapTrailLegend__label">{item.label}</span>
          </li>
        ))}
      </ul>
    </CollapsibleTrailLegend>
  );
};

export default MapLegend;
