import React from "react";
import AboutIcon from "../assets/icons/about-icon.svg";
import ContributeIcon from "../assets/icons/contribute-icon.svg";

const Header = ({ handleAboutModal, handleContributeModal }) => {
  return (
    <header className="Header">
      <img src="https://www.mapc.org/wp-content/themes/mapc/assets/images/mapc-logo.svg"
        className="Header__image"
        alt="Metropolitan Area Planning Council" />
      <div className="Header__title">
        <span className="Header__title--bold">
          Trailmap
          <span className="Header__title--mobile-remove">:
          </span>
        </span>
        <span className="Header__title--mobile-remove">
          Metro Boston's Regional Walking and Cycling Map
        </span>
        <button onClick={handleContributeModal} className="Header__contribute">
          <img src={ContributeIcon} alt="Contribute Map" />
        </button>
        <button onClick={handleAboutModal} className="Header__about">
          <img src={AboutIcon} alt="About Map" />
        </button>
      </div>
    </header>
  )
};

export default Header;

