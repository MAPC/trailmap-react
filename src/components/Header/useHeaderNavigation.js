import { useLocation } from "react-router-dom";
import { usePrimaryNavigation } from "../../hooks/usePrimaryNavigation";

export const useHeaderNavigation = () => {
  const location = useLocation();
  const {
    enterCommunityProfile,
    enterRegionalProfile,
    goToTrailsOverview,
    goToDashboard,
  } = usePrimaryNavigation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "";
    }
    return location.pathname === path;
  };

  const handleNavClick = (item) => {
    if (item.id === "trails") {
      goToTrailsOverview();
    } else if (item.id === "dashboard") {
      goToDashboard();
    } else if (item.id === "community") {
      enterCommunityProfile();
    } else if (item.id === "regional") {
      enterRegionalProfile();
    }
  };

  return { isActive, handleNavClick };
};
