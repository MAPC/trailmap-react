export const MOBILE_NAV_MAX_WIDTH = 680;

export const HEADER_NAV_ITEMS = [
  {
    id: "trails",
    label: "Regional Trail Map",
    path: "/",
    icon: "bi-map-fill",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: "bi-grid-fill",
  },
  {
    id: "community",
    label: "Community Profiles",
    path: "/communityTrailsProfile",
    icon: "bi-person-fill",
  },
  {
    id: "regional",
    label: "Trail Profiles",
    path: "/projectTrailsProfile",
    icon: "bi-graph-up",
  },
];

export const getHeaderNavItems = () => HEADER_NAV_ITEMS;

export const HEADER_ACTION_ITEMS = [
  {
    id: "contribute",
    label: "Contribute trail info",
    iconClass: "bi-pencil-square",
    modal: "contribute",
  },
  {
    id: "about",
    label: "About Trailmap",
    iconKey: "about",
    dropdownIconClass: "bi-info-circle",
    modal: "about",
  },
  {
    id: "glossary",
    label: "Glossary of trail types",
    iconKey: "glossary",
    dropdownIconClass: "bi-journal-text",
    modal: "glossary",
  },
  {
    id: "assist",
    label: "Help & getting started",
    iconKey: "help",
    dropdownIconClass: "bi-question-circle",
    modal: "intro",
  },
];
