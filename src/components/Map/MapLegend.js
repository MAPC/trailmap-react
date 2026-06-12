import React, { useContext, useMemo, useState } from "react";
import Collapse from "react-bootstrap/Collapse";
import { LayerContext } from "../../App";
import {
  TRAIL_LAYER_CATEGORIES,
  LANDLINE_SWATCH_COLOR,
  getLayerColor,
} from "../ControlPanel/trailLayerConfig";

const MapLegend = ({ controlPanelOpen = false }) => {
  const [open, setOpen] = useState(true);
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
    <div
      className={`MapLegend${open ? " MapLegend--open" : ""}${
        controlPanelOpen ? " MapLegend--panelOpen" : ""
      }`}
    >
      <button
        type="button"
        className="MapLegend__toggle"
        aria-expanded={open}
        aria-controls="map-legend-panel"
        id="map-legend-toggle"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span>On the map</span>
        <i
          className={`bi bi-chevron-${open ? "up" : "down"}`}
          aria-hidden="true"
        />
      </button>
      <Collapse in={open}>
        <div id="map-legend-panel">
          <div className="MapLegend__panel">
            <ul className="MapLegend__list">
              {legendItems.map((item) => (
                <li key={item.key} className="MapLegend__item">
                  <span
                    className={`MapLegend__swatch${
                      item.dashed ? " MapLegend__swatch--dashed" : ""
                    }`}
                    style={{ "--swatch-color": item.color }}
                    aria-hidden="true"
                  />
                  <span className="MapLegend__label">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Collapse>
    </div>
  );
};

export default MapLegend;
