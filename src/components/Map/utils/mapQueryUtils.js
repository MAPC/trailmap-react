/**
 * Get feature(s) from vector layers at a map click point.
 * Tries event.features first, then queryRenderedFeatures with center + tolerance points
 * (helps catch thin lines not exactly at click).
 *
 * @param {object} map - Mapbox map instance
 * @param {object} event - Map click event with lngLat and optional features
 * @param {string[]} layerIds - Layer IDs to query (e.g. ['major-trails-layer'])
 * @param {object} options - { returnAll: true } to return array of all matching features
 * @returns {object|object[]|null} First matching feature, or array if returnAll, or null
 */
export const getFeaturesAtPoint = (map, event, layerIds, options = {}) => {
  if (!map || !event?.lngLat) return options.returnAll ? [] : null;

  const matchLayer = (f) => f.layer?.id && layerIds.includes(f.layer.id);

  // 1. Try event.features
  if (event.features?.length) {
    const found = event.features.filter(matchLayer);
    if (found.length) return options.returnAll ? found : found[0];
  }

  // 2. queryRenderedFeatures at center + tolerance points
  const { lng, lat } = event.lngLat;
  const centerPoint = [lng, lat];
  const layerFilter = { layers: layerIds };

  try {
    let features = map.queryRenderedFeatures(centerPoint, layerFilter).filter(matchLayer);
    if (features.length) return options.returnAll ? features : features[0];

    // 3. Try points around click (for thin lines)
    const zoom = map.getZoom();
    const t = Math.max(0.0001, 0.0005 / Math.pow(2, zoom - 10));
    const points = [
      centerPoint,
      [lng + t, lat], [lng - t, lat], [lng, lat + t], [lng, lat - t],
      [lng + t, lat + t], [lng - t, lat - t], [lng + t, lat - t], [lng - t, lat + t]
    ];

    for (const pt of points) {
      features = map.queryRenderedFeatures(pt, layerFilter).filter(matchLayer);
      if (features.length) return options.returnAll ? features : features[0];
    }

    // 4. Fallback: query all layers at point
    const all = map.queryRenderedFeatures(centerPoint).filter(matchLayer);
    if (all.length) return options.returnAll ? all : all[0];
  } catch (err) {
    console.warn("Error querying features at point:", err.message);
  }

  return options.returnAll ? [] : null;
};

/**
 * Query vector trail layers at the pointer position (pixel box tolerance for thin lines).
 */
export const getTrailFeatureAtEvent = (map, event, layerIds) => {
  if (!map || !event?.point || !layerIds?.length) return null;

  const { x, y } = event.point;
  const padding = 10;

  try {
    const features = map.queryRenderedFeatures(
      [
        [x - padding, y - padding],
        [x + padding, y + padding],
      ],
      { layers: layerIds }
    );

    const matching = features.filter((feature) => layerIds.includes(feature.layer?.id));
    return matching[0] || null;
  } catch (err) {
    console.warn("Error querying trail feature at pointer:", err.message);
    return null;
  }
};
