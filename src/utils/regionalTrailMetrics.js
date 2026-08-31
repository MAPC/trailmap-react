import { getMunicipalityName } from "../components/Map/utils/municipalityUtils";
import {
  GAP_FACILITY_TYPE_LABEL,
  getTrailFacilityTypeLabel,
} from "../components/Map/constants/trailFacilityTypeLabels";

export const calculateTrailMetrics = (trails) => {
  if (!trails || trails.length === 0) {
    return {
      totalLength: 0,
      totalLengthMiles: "0.00",
      completedLengthMiles: "0.00",
      percentageComplete: "0",
      municipalities: [],
      municipalityIds: [],
      parks: [],
      lengthByType: [],
      gaps: [],
      existingLengthMiles: "0.00",
      underConstructionLengthMiles: "0.00",
      envisionedLengthMiles: "0.00",
      gapLengthMiles: "0.00",
      plannedLengthMiles: "0.00",
      segmentCount: 0,
    };
  }

  let totalLengthFeet = 0;
  let completedLengthFeet = 0;
  let underConstructionLengthFeet = 0;
  let envisionedLengthFeet = 0;
  let gapLengthFeet = 0;
  const lengthByTypeExisting = {};
  const lengthByTypePlanned = {};
  const lengthByTypeGapSegments = [];
  const gaps = [];
  const municipalitySet = new Set();
  const municipalityIdSet = new Set();

  trails.forEach((trail) => {
    const props = trail.properties || {};
    const segType = props.seg_type;
    const facStat = props.fac_stat;
    const trailTypeLabel =
      getTrailFacilityTypeLabel(segType, facStat) || "Unknown";
    const lengthFeet = Number(props.length_ft) || 0;

    totalLengthFeet += lengthFeet;

    if (String(segType) === "9") {
      gapLengthFeet += lengthFeet;
      lengthByTypeGapSegments.push({
        type: GAP_FACILITY_TYPE_LABEL,
        lengthFeet,
      });
      gaps.push({ type: GAP_FACILITY_TYPE_LABEL, length: lengthFeet });
    } else {
      switch (String(facStat)) {
        case "1":
          completedLengthFeet += lengthFeet;
          lengthByTypeExisting[trailTypeLabel] =
            (lengthByTypeExisting[trailTypeLabel] || 0) + lengthFeet;
          break;
        case "2":
          underConstructionLengthFeet += lengthFeet;
          lengthByTypePlanned[trailTypeLabel] =
            (lengthByTypePlanned[trailTypeLabel] || 0) + lengthFeet;
          break;
        case "3":
          envisionedLengthFeet += lengthFeet;
          lengthByTypePlanned[trailTypeLabel] =
            (lengthByTypePlanned[trailTypeLabel] || 0) + lengthFeet;
          break;
        default:
          break;
      }
    }

    const muniId = props.muni_id || null;
    if (muniId) {
      municipalityIdSet.add(String(muniId));
      const muniName = getMunicipalityName(muniId);
      if (muniName) municipalitySet.add(muniName);
    }
  });

  const totalLengthMiles = totalLengthFeet / 5280;
  const percentageComplete =
    totalLengthFeet > 0
      ? ((completedLengthFeet / totalLengthFeet) * 100).toFixed(0)
      : "0";

  const lengthByTypeArray = [
    ...Object.entries(lengthByTypeExisting).map(([type, feet]) => ({
      type,
      miles: (feet / 5280).toFixed(2),
      category: "existing",
    })),
    ...Object.entries(lengthByTypePlanned).map(([type, feet]) => ({
      type,
      miles: (feet / 5280).toFixed(2),
      category: "planned",
    })),
    ...lengthByTypeGapSegments.map((gap) => ({
      type: gap.type,
      miles: (gap.lengthFeet / 5280).toFixed(2),
      category: "gap",
    })),
  ];

  const plannedLengthFeet =
    underConstructionLengthFeet + envisionedLengthFeet;

  return {
    totalLength: totalLengthFeet,
    totalLengthMiles: totalLengthMiles.toFixed(1),
    completedLengthMiles: (completedLengthFeet / 5280).toFixed(1),
    plannedLengthMiles: (plannedLengthFeet / 5280).toFixed(1),
    existingLengthMiles: (completedLengthFeet / 5280).toFixed(1),
    underConstructionLengthMiles: (underConstructionLengthFeet / 5280).toFixed(1),
    envisionedLengthMiles: (envisionedLengthFeet / 5280).toFixed(1),
    gapLengthMiles: (gapLengthFeet / 5280).toFixed(1),
    percentageComplete,
    municipalities: Array.from(municipalitySet).sort(),
    municipalityIds: Array.from(municipalityIdSet).sort(
      (a, b) => Number(a) - Number(b)
    ),
    parks: [],
    lengthByType: lengthByTypeArray,
    gaps: gaps.map((gap) => ({
      type: gap.type,
      lengthMiles: (gap.length / 5280).toFixed(2),
    })),
    segmentCount: trails.length,
  };
};

export const buildAllTrailMetrics = ({
  majorTrailNames,
  otherTrailNames,
  majorTrailsData,
  allTrailsData,
}) => {
  const metrics = {};

  majorTrailNames.forEach((name) => {
    const trails =
      majorTrailsData?.features?.filter(
        (f) => (f.properties?.grouped_reg_name).includes(name.trim())
      ) || [];
    metrics[name] = calculateTrailMetrics(trails);
  });

  otherTrailNames.forEach((name) => {
    // Major trail metrics take precedence; don't overwrite them when the
    // sync service has a reg_name identical to a major trail name.
    if (majorTrailNames.includes(name)) return;
    const trails =
      allTrailsData?.features?.filter(
        (f) => (f.properties?.reg_name).includes(name.trim())
      ) || [];
    metrics[name] = calculateTrailMetrics(trails);
  });

  return metrics;
};

export const downloadTrailGeoJSON = ({
  regName,
  isMajor,
  allTrailsData,
  majorTrailsData,
}) => {
  let trailFeatures = [];

  if (isMajor && majorTrailsData?.features) {
    trailFeatures = majorTrailsData.features.filter(
      (f) => (f.properties?.grouped_reg_name).includes(regName.trim())
    );
  } else if (allTrailsData?.features) {
    trailFeatures = allTrailsData.features.filter(
      (f) => (f.properties?.reg_name).includes(regName.trim())
    );
  }

  if (trailFeatures.length === 0) return false;

  const geoJSON = { type: "FeatureCollection", features: trailFeatures };
  const sanitizedName = regName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const blob = new Blob([JSON.stringify(geoJSON, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizedName}_trails.geojson`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
