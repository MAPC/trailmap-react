import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ModalContext } from "../../App";
import Control from "../Map/Control";
import HeaderNav from "./HeaderNav";
import AboutIcon from "../../assets/icons/about-icon.svg";
import GlossaryIcon from "../../assets/icons/glossary-icon.svg";
import HelpIcon from "../../assets/icons/help-icon.svg";
import TrailmapLogo from "../../assets/MAPC_logo.svg";

const Header = () => {
  const { toggleHeaderModal } = useContext(ModalContext);

  return (
    <header className="Header d-flex flex-row align-items-center position-absolute">
      <Link className="Header__brand" to="/" aria-label="Trailmap home">
        <img src={TrailmapLogo} className="Header__image" alt="Metropolitan Area Planning Council" />
      </Link>

      <div className="Header__title">
        <span className="Header__title--main Header__title--small-mobile-remove">
          Trailmap
          <span className="Header__title--mobile-remove">:</span>
        </span>
        <span className="Header__title--subtitle Header__title--mobile-remove ps-2">
          Metro Boston&apos;s Regional Walking and Cycling Map
        </span>
      </div>

      <HeaderNav />

      <div className="Header__actions">
        <Control
          style="Header__action Header__contribute"
          iconClass="bi bi-pencil-square"
          alt="Contribute trail info"
          tooltip="Contribute trail info"
          tooltipId="header-contribute-tooltip"
          tooltipPlacement="bottom"
          clickHandler={() => toggleHeaderModal("contribute")}
        />
        <Control
          style="Header__action Header__about"
          icon={AboutIcon}
          alt="About Trailmap"
          tooltip="About Trailmap"
          tooltipId="header-about-tooltip"
          tooltipPlacement="bottom"
          clickHandler={() => toggleHeaderModal("about")}
        />
        <Control
          style="Header__action Header__glossary"
          icon={GlossaryIcon}
          alt="Glossary of trail types"
          tooltip="Glossary of trail types"
          tooltipId="header-glossary-tooltip"
          tooltipPlacement="bottom"
          clickHandler={() => toggleHeaderModal("glossary")}
        />
        <Control
          style="Header__action Header__assist"
          icon={HelpIcon}
          alt="Help and getting started"
          tooltip="Help & getting started"
          tooltipId="header-help-tooltip"
          tooltipPlacement="bottom"
          clickHandler={() => toggleHeaderModal("intro")}
        />
      </div>
    </header>
  );
};

export default Header;
