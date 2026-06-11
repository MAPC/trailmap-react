// Must match grouped_reg_name in export_major_trails FeatureServer
export const MAJOR_TRAILS = [
  "Bay Circuit",
  "Bruce Freeman",
  "Charles River Greenway",
  "Minuteman",
  "Neponset River",
  "Northern Strand",
].sort();

export const MAJOR_TRAIL_DISPLAY_NAMES = {
  "Bay Circuit": "Bay Circuit Trail",
  "Bruce Freeman": "Bruce Freeman Rail Trail",
  "Charles River Greenway": "Charles River Greenway",
  Minuteman: "Minuteman Bikeway",
  "Neponset River": "Neponset River Greenway",
  "Northern Strand": "Northern Strand Community Trail",
};

export const TRAIL_ACCENT_COLORS = {
  "Bay Circuit": "#c45c4a",
  "Bruce Freeman": "#2774bd",
  "Charles River Greenway": "#2a9d8f",
  Minuteman: "#2d6a4f",
  "Neponset River": "#6a4c93",
  "Northern Strand": "#e76f51",
};

const OTHER_TRAIL_PALETTE = [
  "#2774bd",
  "#2a9d8f",
  "#6a4c93",
  "#e76f51",
  "#c45c4a",
  "#2d6a4f",
  "#f4a261",
  "#457b9d",
];

export const getDisplayName = (name, isMajor = false) => {
  if (isMajor && MAJOR_TRAIL_DISPLAY_NAMES[name]) {
    return MAJOR_TRAIL_DISPLAY_NAMES[name];
  }
  return name;
};

export const getTrailColor = (name, isMajor, index = 0) => {
  if (isMajor && TRAIL_ACCENT_COLORS[name]) {
    return TRAIL_ACCENT_COLORS[name];
  }
  return OTHER_TRAIL_PALETTE[index % OTHER_TRAIL_PALETTE.length];
};

export const getStatusLabel = (percentageComplete) => {
  const pct = Number(percentageComplete) || 0;
  if (pct >= 100) return { label: "Complete", variant: "complete" };
  return { label: "In progress", variant: "progress" };
};

export const isMajorTrail = (name) => MAJOR_TRAILS.includes(name);
