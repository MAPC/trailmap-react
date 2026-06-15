import React, { useContext, useEffect, useRef, useState } from "react";
import { ModalContext } from "../../App";
import HeaderNav from "./HeaderNav";
import HeaderActions from "./HeaderActions";
import { HEADER_ACTION_ITEMS, HEADER_NAV_ITEMS } from "./headerMenuConfig";
import { useHeaderNavigation } from "./useHeaderNavigation";

const HeaderMenu = () => {
  const { toggleHeaderModal } = useContext(ModalContext);
  const { isActive, handleNavClick } = useHeaderNavigation();
  const regionRef = useRef(null);
  const probeRef = useRef(null);
  const menuRef = useRef(null);
  const [useHamburger, setUseHamburger] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const region = regionRef.current;
      const probe = probeRef.current;
      if (!region || !probe) return;
      setUseHamburger(probe.scrollWidth > region.clientWidth + 1);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    if (regionRef.current) observer.observe(regionRef.current);
    if (probeRef.current) observer.observe(probeRef.current);

    window.addEventListener("resize", checkOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  useEffect(() => {
    if (!useHamburger) {
      setMenuOpen(false);
    }
  }, [useHamburger]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleMenuNavClick = (item) => {
    handleNavClick(item);
    closeMenu();
  };

  const handleMenuActionClick = (modal) => {
    toggleHeaderModal(modal);
    closeMenu();
  };

  const renderActionIcon = (item) => {
    const iconClass = item.dropdownIconClass || item.iconClass;
    if (iconClass) {
      return <i className={`bi ${iconClass}`} aria-hidden="true" />;
    }
    return null;
  };

  return (
    <div className="Header__menuRegion" ref={regionRef}>
      <div className="Header__menuProbe" ref={probeRef} aria-hidden="true">
        <HeaderNav />
        <HeaderActions showTooltips={false} />
      </div>

      {useHamburger ? (
        <div className="Header__hamburger" ref={menuRef}>
          <button
            type="button"
            className="Header__hamburgerBtn"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <i
              className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`}
              aria-hidden="true"
            />
          </button>

          {menuOpen && (
            <div className="Header__hamburgerPanel" role="menu">
              <ul className="Header__hamburgerList">
                {HEADER_NAV_ITEMS.map((item) => (
                  <li key={item.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className={`Header__hamburgerItem${isActive(item.path) ? " Header__hamburgerItem--active" : ""}`}
                      aria-current={isActive(item.path) ? "page" : undefined}
                      onClick={() => handleMenuNavClick(item)}
                    >
                      <i className={`bi ${item.icon}`} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="Header__hamburgerDivider" role="separator" />

              <ul className="Header__hamburgerList Header__hamburgerList--actions">
                {HEADER_ACTION_ITEMS.map((item) => (
                  <li key={item.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="Header__hamburgerItem Header__hamburgerItem--action"
                      onClick={() => handleMenuActionClick(item.modal)}
                    >
                      <span className="Header__hamburgerItemIcon">
                        {renderActionIcon(item)}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="Header__menuContent">
          <HeaderNav />
          <HeaderActions />
        </div>
      )}
    </div>
  );
};

export default HeaderMenu;
