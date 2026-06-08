import React, { useContext, useMemo } from "react";
import { LayerContext } from "../../App";
import TrailLayerSection from "./TrailLayerSection";
import TrailLayerRow from "./TrailLayerRow";
import {
  TRAIL_LAYER_CATEGORIES,
  LANDLINE_SWATCH_COLOR,
  getLayerColor,
  getExistingLayerIds,
  getProposedLayerIds,
} from "./trailLayerConfig";

const TrailsOverviewPanel = () => {
  const {
    existingTrails,
    proposedTrails,
    trailLayers,
    setTrailLayers,
    proposedLayers,
    setProposedLayers,
    showLandlineLayer,
    toggleLandlineLayer,
  } = useContext(LayerContext);

  const existingIds = getExistingLayerIds();
  const proposedIds = getProposedLayerIds();

  const activeTypeCount =
    trailLayers.length + proposedLayers.length + (showLandlineLayer ? 1 : 0);

  const buildCategories = (layerType) =>
    TRAIL_LAYER_CATEGORIES.map((category) => ({
      title: category.title,
      rows: category.items.map((item) => {
        const id = layerType === "existing" ? item.existingId : item.proposedId;
        const sourceLayers = layerType === "existing" ? existingTrails : proposedTrails;
        return {
          id,
          label: item.label,
          color: getLayerColor(sourceLayers, id),
          dashed: layerType === "planned",
        };
      }),
    }));

  const existingCategories = useMemo(
    () => buildCategories("existing"),
    [existingTrails]
  );
  const plannedCategories = useMemo(
    () => buildCategories("planned"),
    [proposedTrails]
  );

  const toggleExistingLayer = (layerId, checked) => {
    setTrailLayers((current) =>
      checked
        ? current.includes(layerId)
          ? current
          : [...current, layerId]
        : current.filter((id) => id !== layerId)
    );
  };

  const toggleProposedLayer = (layerId, checked) => {
    setProposedLayers((current) =>
      checked
        ? current.includes(layerId)
          ? current
          : [...current, layerId]
        : current.filter((id) => id !== layerId)
    );
  };

  const toggleAllExisting = (enable) => {
    setTrailLayers(enable ? [...existingIds] : []);
  };

  const toggleAllPlanned = (enable) => {
    setProposedLayers(enable ? [...proposedIds] : []);
  };

  const clearAllLayers = () => {
    setTrailLayers([]);
    setProposedLayers([]);
    if (showLandlineLayer) {
      toggleLandlineLayer(false);
    }
  };

  return (
    <div className="TrailsOverviewPanel">
      <div className="TrailsOverviewPanel__intro">
        <h2 className="TrailsOverviewPanel__heading">Find trails that work for you</h2>
        <p className="TrailsOverviewPanel__lead">
          Toggle trail types to build your map, or start from a quick preset.
        </p>
      </div>

      <div className="TrailsOverviewPanel__summary">
        <div className="TrailsOverviewPanel__summary-text">
          <span className="TrailsOverviewPanel__summary-dot" aria-hidden="true" />
          <span>
            {activeTypeCount} trail type{activeTypeCount === 1 ? "" : "s"} on the map
          </span>
        </div>
        {activeTypeCount > 0 && (
          <button
            type="button"
            className="TrailsOverviewPanel__clear"
            onClick={clearAllLayers}
          >
            Clear
          </button>
        )}
      </div>

      <TrailLayerSection
        title="Existing trails"
        layerType="existing"
        categories={existingCategories}
        activeLayerIds={trailLayers}
        onToggleLayer={toggleExistingLayer}
        onToggleAll={toggleAllExisting}
        allLayerIds={existingIds}
      />

      <TrailLayerSection
        title="Planned trails"
        layerType="planned"
        note="Planned trails appear dashed on the map."
        categories={plannedCategories}
        activeLayerIds={proposedLayers}
        onToggleLayer={toggleProposedLayer}
        onToggleAll={toggleAllPlanned}
        allLayerIds={proposedIds}
      />

      <div className="TrailsOverviewPanel__landline">
        <TrailLayerRow
          id="landline-greenway"
          label="LandLine Regional Greenway"
          color={LANDLINE_SWATCH_COLOR}
          checked={showLandlineLayer}
          onChange={(checked) => toggleLandlineLayer(checked)}
        />
        <a
          className="TrailsOverviewPanel__landline-link"
          href="https://mapc.github.io/embedded-map/"
          target="_blank"
          rel="noopener noreferrer"
        >
          About the LandLine vision →
        </a>
      </div>
    </div>
  );
};

export default TrailsOverviewPanel;
