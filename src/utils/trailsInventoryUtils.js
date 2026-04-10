import bbox from "@turf/bbox";
import * as turf from "@turf/turf";

/** Widest reasonable calendar range for GIS edit metadata (UTC). */
const EPOCH_YEAR_MIN = 1970;
const EPOCH_YEAR_MAX = 3000;

/**
 * Interpret a numeric field as epoch time (ms or seconds) when it parses to a
 * plausible calendar year. Avoids hardcoded ms cutoffs so pre-2000 / post-2100
 * edits still format correctly.
 */
function epochNumericToMilliseconds(n) {
  if (!Number.isFinite(n)) return null;
  const candidates = [];
  if (n >= 1e11) candidates.push(n);
  if (n >= 1e9 && n < 1e11) candidates.push(Math.round(n * 1000));
  if (candidates.length === 0 && n > 0) candidates.push(n);

  for (const ms of candidates) {
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) continue;
    const y = d.getUTCFullYear();
    if (y >= EPOCH_YEAR_MIN && y <= EPOCH_YEAR_MAX) return ms;
  }
  return null;
}

function isDateLikeInventoryColumn(key) {
  if (key === "_idx") return false;
  const k = String(key).toLowerCase();
  if (k === "open_date") return false;
  if (k === "last_edited_date" || k === "created_date") return true;
  if (k.endsWith("_date")) return true;
  return /(edit|creation|created|modified)date/i.test(String(key));
}

/**
 * Format ESRI-style epoch-ms fields for display or CSV export.
 * @returns {string|null} formatted string, or null if the value should use default formatting
 */
export function formatInventoryField(columnKey, val, { variant = "table" } = {}) {
  if (val == null || val === "") return null;
  const n = typeof val === "number" ? val : Number(val);
  if (Number.isNaN(n) || !isDateLikeInventoryColumn(columnKey)) return null;
  const ms = epochNumericToMilliseconds(n);
  if (ms === null) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  if (variant === "csv") {
    return d.toISOString();
  }
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isEmptySortValue(v) {
  return v == null || v === "";
}

/**
 * Compare two cell values for inventory column sorting (ascending).
 */
export function compareInventoryRowValues(columnKey, valA, valB) {
  if (isEmptySortValue(valA) && isEmptySortValue(valB)) return 0;
  if (isEmptySortValue(valA)) return 1;
  if (isEmptySortValue(valB)) return -1;

  if (columnKey === "_idx") {
    return Number(valA) - Number(valB);
  }

  if (isDateLikeInventoryColumn(columnKey)) {
    const nA = typeof valA === "number" ? valA : Number(valA);
    const nB = typeof valB === "number" ? valB : Number(valB);
    const msA = Number.isFinite(nA) ? epochNumericToMilliseconds(nA) : null;
    const msB = Number.isFinite(nB) ? epochNumericToMilliseconds(nB) : null;
    if (msA != null && msB != null) return msA - msB;
    if (msA != null) return -1;
    if (msB != null) return 1;
  }

  return String(valA).localeCompare(String(valB), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

const COLUMN_PRIORITY = [
  "layerName",
  "layerId",
  "name",
  "trail_name",
  "reg_name",
  "seg_type",
  "fac_stat",
  "length_ft",
  "OBJECTID",
  "objectid",
];

export function computeInventoryBounds(selectedMunicipality, trails) {
  const feats = [];
  if (selectedMunicipality?.geometry) {
    feats.push(turf.feature(selectedMunicipality.geometry));
  }
  (trails || []).forEach((t) => {
    if (t?.geometry?.coordinates) {
      feats.push(turf.feature(t.geometry));
    }
  });
  if (feats.length === 0) {
    return [-73.5, 41.2, -69.9, 42.9];
  }
  return bbox(turf.featureCollection(feats));
}

export function buildInventoryTableModel(municipalityTrails) {
  if (!municipalityTrails?.length) {
    return { rows: [], columns: [] };
  }
  const rows = municipalityTrails.map((trail, idx) => {
    const attrs = trail.attributes || {};
    return {
      _idx: idx + 1,
      ...attrs,
      layerName: trail.layerName ?? "",
      layerId: trail.layerId ?? "",
    };
  });
  const keySet = new Set();
  rows.forEach((r) => {
    Object.keys(r).forEach((k) => {
      if (k !== "_idx") keySet.add(k);
    });
  });
  const keys = [...keySet];
  const prioritized = COLUMN_PRIORITY.filter((c) => keys.includes(c));
  const rest = keys
    .filter((k) => !COLUMN_PRIORITY.includes(k))
    .sort((a, b) => a.localeCompare(b));
  const columns = ["_idx", ...prioritized, ...rest];
  return { rows, columns };
}

export function downloadInventoryCsv(filename, rows, columns) {
  const csvCols = columns.filter((c) => c !== "_idx");
  const esc = (val) => {
    if (val == null) return "";
    const s = String(val);
    if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = csvCols.map(esc).join(",");
  const lines = rows.map((row) =>
    csvCols
      .map((c) => {
        const v = row[c];
        const formatted = formatInventoryField(c, v, { variant: "csv" });
        return esc(formatted !== null ? formatted : v);
      })
      .join(",")
  );
  const blob = new Blob([[header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
