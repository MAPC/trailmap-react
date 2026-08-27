const BOUNDARY_LAYER_IDS = new Set([
  "boundary-ma-house-fill",
  "boundary-ma-house-lines",
  "boundary-ma-senate-fill",
  "boundary-ma-senate-lines",
  "boundary-municipalities-fill",
  "boundary-municipalities-line",
  "boundary-mapc-line",
  "ma-house-districts-fill",
  "ma-house-districts-hover",
  "ma-house-districts-lines",
  "ma-senate-districts-fill",
  "ma-senate-districts-hover",
  "ma-senate-districts-lines",
  "municipalities-fill",
  "municipalities-hover",
  "mapc-boundary-fill",
  "mapc-boundary-hover",
  "municipality-profile-base",
  "municipality-profile-unselected",
  "municipality-profile-outline",
  "municipality-profile-selected-outline",
]);

const isBasemapLayer = (layer) => {
  if (!layer || BOUNDARY_LAYER_IDS.has(layer.id)) return false;
  if (layer.type === "background") return true;
  const source = layer.source;
  return source === "composite" || (typeof source === "string" && source.startsWith("mapbox"));
};

/**
 * Keep municipality / district / MAPC outlines under trails and other overlays.
 * Newly toggled Mapbox layers are appended on top, so this reinserts them below
 * the first non-boundary overlay.
 */
export const moveBoundaryLayersToBottom = (map) => {
  if (!map?.getStyle || !map.getLayer) return;

  const styleLayers = map.getStyle()?.layers;
  if (!styleLayers?.length) return;

  const boundaryIds = styleLayers
    .map((layer) => layer.id)
    .filter((id) => BOUNDARY_LAYER_IDS.has(id) && map.getLayer(id));
  if (!boundaryIds.length) return;

  const firstOverlay = styleLayers.find(
    (layer) => !isBasemapLayer(layer) && !BOUNDARY_LAYER_IDS.has(layer.id)
  );
  if (!firstOverlay || !map.getLayer(firstOverlay.id)) return;

  const firstOverlayIndex = styleLayers.findIndex((layer) => layer.id === firstOverlay.id);
  const alreadyBelow = boundaryIds.every((id) => {
    const index = styleLayers.findIndex((layer) => layer.id === id);
    return index > -1 && index < firstOverlayIndex;
  });
  if (alreadyBelow) return;

  boundaryIds.forEach((id) => {
    try {
      map.moveLayer(id, firstOverlay.id);
    } catch (_err) {
      // Layer may have been removed while the style was updating.
    }
  });
};

export const keepBoundaryLayersAtBottom = (map) => {
  if (!map) return () => {};

  const run = () => {
    if (typeof map.isStyleLoaded === "function" && !map.isStyleLoaded()) return;
    moveBoundaryLayersToBottom(map);
  };

  run();
  const timeoutIds = [0, 50, 250].map((delay) => setTimeout(run, delay));
  map.on("styledata", run);

  return () => {
    timeoutIds.forEach(clearTimeout);
    if (map.off) map.off("styledata", run);
  };
};

export const attachBoundaryLayerOrder = (mapRef) => {
  let cleanup = () => {};
  let intervalId;

  const tryAttach = () => {
    const map = mapRef?.current?.getMap?.();
    if (!map) return false;
    cleanup = keepBoundaryLayersAtBottom(map);
    return true;
  };

  if (!tryAttach()) {
    intervalId = setInterval(() => {
      if (tryAttach()) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }, 50);
  }

  return () => {
    if (intervalId) clearInterval(intervalId);
    cleanup();
  };
};
