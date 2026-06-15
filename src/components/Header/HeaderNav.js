import React from "react";
import { HEADER_NAV_ITEMS } from "./headerMenuConfig";
import { useHeaderNavigation } from "./useHeaderNavigation";

const HeaderNav = () => {
  const { isActive, handleNavClick } = useHeaderNavigation();

  const navItemClass = (path) =>
    `Header__nav-item${isActive(path) ? " Header__nav-item--active" : ""}`;

  return (
    <nav className="Header__nav" aria-label="Primary">
      <ul className="Header__nav-list">
        {HEADER_NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={navItemClass(item.path)}
              aria-current={isActive(item.path) ? "page" : undefined}
              onClick={() => handleNavClick(item)}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span className="Header__nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default HeaderNav;
