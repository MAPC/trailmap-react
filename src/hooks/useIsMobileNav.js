import { useEffect, useState } from "react";
import { MOBILE_NAV_MAX_WIDTH } from "../components/Header/headerMenuConfig";

const getMediaQuery = () =>
  typeof window !== "undefined"
    ? window.matchMedia(`(max-width: ${MOBILE_NAV_MAX_WIDTH}px)`)
    : null;

export const useIsMobileNav = () => {
  const [isMobile, setIsMobile] = useState(() => getMediaQuery()?.matches ?? false);

  useEffect(() => {
    const mediaQuery = getMediaQuery();
    if (!mediaQuery) {
      return undefined;
    }

    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
};
