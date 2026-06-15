import React from "react";
import { Link } from "react-router-dom";
import HeaderMenu from "./HeaderMenu";
import TrailmapLogo from "../../assets/MAPC_logo.svg";

const Header = () => {
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

      <HeaderMenu />
    </header>
  );
};

export default Header;
