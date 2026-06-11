export const ARCGIS_TOKEN = process.env.REACT_APP_ARCGIS_TOKEN || "";

export const withArcGisToken = (url) => {
  if (!ARCGIS_TOKEN) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${ARCGIS_TOKEN}`;
};
