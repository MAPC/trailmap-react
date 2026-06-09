import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePrimaryNavigation } from "../../hooks/usePrimaryNavigation";

const NAV_ITEMS = [
  {
    id: "trails",
    label: "Trails Overview",
    path: "/",
    icon: "bi-map-fill",
    isHome: true,
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
    label: "Regional Trails Profiles",
    path: "/projectTrailsProfile",
    icon: "bi-graph-up",
  },
];

const HeaderNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { enterCommunityProfile, enterRegionalProfile } = usePrimaryNavigation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "";
    }
    return location.pathname === path;
  };

  const handleNavClick = (item) => {
    if (item.id === "community") {
      enterCommunityProfile();
    } else if (item.id === "regional") {
      enterRegionalProfile();
    } else {
      navigate(item.path);
    }
  };

  const navItemClass = (path) =>
    `Header__nav-item${isActive(path) ? " Header__nav-item--active" : ""}`;

  return (
    <nav className="Header__nav" aria-label="Primary">
      <ul className="Header__nav-list">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            {item.isHome ? (
              <Link
                to="/"
                className={`${navItemClass(item.path)} Header__nav-item--link`}
                aria-current={isActive(item.path) ? "page" : undefined}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span className="Header__nav-label">{item.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                className={navItemClass(item.path)}
                aria-current={isActive(item.path) ? "page" : undefined}
                onClick={() => handleNavClick(item)}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span className="Header__nav-label">{item.label}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default HeaderNav;
