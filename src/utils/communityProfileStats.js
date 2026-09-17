import { COMMUNITY_PROFILE_LAYER_LENGTH_MI_KEYS } from "./trailMetricsDashboard";
import {
  mapcTrailLayers,
  mapcTrailFacilityPairs,
  TRAIL_STATUS,
} from "../components/Map/constants/mapcTrailLayersConfig";

const milesToFeet = (miles) => (Number(miles) || 0) * 5280;

export const emptyTrailStats = () => ({
  totalTrails: 0,
  totalLength: 0,
  existingLength: 0,
  plannedLength: 0,
  proposedLength: 0,
  byType: {},
  density: null,
  area: 0,
});

/** Build overview stats from the same trail-metrics API row the dashboard uses. */
export const buildTrailStatsFromMetricsRow = (row) => {
  if (!row) return emptyTrailStats();

  const stats = emptyTrailStats();
  const existingLength = milesToFeet(row.existingMiles);
  const plannedLength = milesToFeet(row.plannedMiles);
  const proposedLength = milesToFeet(row.proposedMiles);

  stats.existingLength = existingLength;
  stats.plannedLength = plannedLength;
  stats.proposedLength = proposedLength;
  stats.totalLength = existingLength + plannedLength + proposedLength;
  stats.area = Number(row.areaSqMi) || 0;
  stats.density = row.density != null ? Number(row.density) : null;

  mapcTrailLayers.forEach((layer) => {
    const key = COMMUNITY_PROFILE_LAYER_LENGTH_MI_KEYS[layer.id];
    const length = key ? milesToFeet(row[key]) : 0;
    stats.byType[layer.name] = {
      count: length > 0 ? 1 : 0,
      length,
      color: layer.color,
      status: layer.status,
      layerId: layer.id,
    };
  });

  return stats;
};

export const formatFeetAsMiles = (feet) => {
  const numFeet = Number(feet) || 0;
  const miles = numFeet / 5280;
  return parseFloat(miles.toFixed(2)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const getTrailTypeStatusRows = (stats) => {
  if (!stats?.byType) return [];

  return mapcTrailFacilityPairs
    .map(({ existingId, otherIds, label }) => {
      const layerIds = [existingId, ...otherIds];
      const lengths = {
        [TRAIL_STATUS.EXISTING]: 0,
        [TRAIL_STATUS.PLANNED]: 0,
        [TRAIL_STATUS.PROPOSED]: 0,
      };
      let color = "#888";

      layerIds.forEach((layerId) => {
        const layer = mapcTrailLayers.find((item) => item.id === layerId);
        if (!layer) return;

        const length = stats.byType[layer.name]?.length || 0;
        lengths[layer.status] += length;
        if (layer.status === TRAIL_STATUS.EXISTING || color === "#888") {
          color = layer.color;
        }
      });

      const total =
        lengths[TRAIL_STATUS.EXISTING] +
        lengths[TRAIL_STATUS.PLANNED] +
        lengths[TRAIL_STATUS.PROPOSED];

      return {
        label,
        color,
        total,
        existing: lengths[TRAIL_STATUS.EXISTING],
        planned: lengths[TRAIL_STATUS.PLANNED],
        proposed: lengths[TRAIL_STATUS.PROPOSED],
        rate: total > 0 ? (lengths[TRAIL_STATUS.EXISTING] / total) * 100 : 0,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
};
