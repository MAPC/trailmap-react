import React, { useEffect, useRef, useState } from "react";
import Control from "../Map/Control";
import AboutIcon from "../../assets/icons/about-icon.svg";
import GlossaryIcon from "../../assets/icons/glossary-icon.svg";
import ContributeIcon from "../../assets/icons/contribute-icon.svg";
import HelpIcon from "../../assets/icons/help-icon.svg";

const HEADER_ACTION_ITEMS = [
  {
    id: "contribute",
    label: "Contribute",
    icon: ContributeIcon,
    alt: "Contribute Map",
    style: "Header__contribute d-flex justify-content-evenly align-items-center m-0 p-0",
    modalKey: "contribute",
  },
  {
    id: "about",
    label: "About",
    icon: AboutIcon,
    alt: "About Map",
    style: "Header__about d-flex justify-content-evenly align-items-center m-0 p-0",
    modalKey: "about",
  },
  {
    id: "glossary",
    label: "Glossary",
    icon: GlossaryIcon,
    alt: "About Trails",
    style: "Header__glossary d-flex justify-content-evenly align-items-center m-0 p-0",
    modalKey: "glossary",
  },
  {
    id: "help",
    label: "Help",
    icon: HelpIcon,
    alt: "Help Me Get Started",
    style: "Header__assist d-flex justify-content-evenly align-items-center m-0 p-0",
    modalKey: "intro",
  },
];

const HeaderActionsMenu = ({ modalState, modalToggles }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const runAction = (modalKey) => {
    const toggle = modalToggles[modalKey];
    const isOpen = modalState[modalKey];
    if (toggle) {
      toggle(!isOpen);
    }
    setMenuOpen(false);
  };

  return (
    <div className="Header__actions" ref={menuRef}>
      <div className="Header__actionsDesktop">
        {HEADER_ACTION_ITEMS.map((item) => (
          <Control
            key={item.id}
            style={item.style}
            icon={item.icon}
            alt={item.alt}
            clickHandler={() => runAction(item.modalKey)}
          />
        ))}
      </div>

      <div className="Header__actionsMobile">
        <button
          type="button"
          className="Header__hamburger"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        {menuOpen && (
          <div className="Header__actionsPanel" role="menu">
            {HEADER_ACTION_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="Header__actionsPanelItem"
                role="menuitem"
                onClick={() => runAction(item.modalKey)}
              >
                <img src={item.icon} alt="" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderActionsMenu;
