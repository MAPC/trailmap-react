import React, { useContext } from "react";
import { ModalContext } from "../../App";
import Control from "../Map/Control";
import AboutIcon from "../../assets/icons/about-icon.svg";
import ContributeIcon from "../../assets/icons/contribute-icon.svg";
import HelpIcon from "../../assets/icons/help-icon.svg";
import TrailmapLogo from "../../assets/MAPC_logo.svg";

const Header = () => {
  const {
    showAboutModal,
    toggleAboutModal,
    showContributeModal,
    toggleContributeModal,
    showIntroModal,
    toggleIntroModal,
  } = useContext(ModalContext);

  return (
    <header className="Header d-flex flex-row align-items-center position-absolute">
      <a href="https://www.mapc.org/resource-library/landline-vision-plan/#google_translate_element" target="_blank">
        <img src={TrailmapLogo} className="Header__image" alt="Metropolitan Area Planning Council" />
      </a>

      <div className="Header__title">
        <span className="Header__title--main">
          Trailmap
          <span className="Header__title--mobile-remove">:</span>
        </span>
        <span className="Header__title--subtitle Header__title--mobile-remove ps-2">
          Metro Boston's Regional Walking and Cycling Map
        </span>
        <Control
          style={"Header__contribute d-flex justify-content-evenly align-items-center m-0 p-0 position-absolute"}
          icon={ContributeIcon}
          alt={"Contribute Map"}
          clickHandler={() => {
            toggleContributeModal(!showContributeModal);
          }}
        />
        <Control
          style={"Header__about d-flex justify-content-evenly align-items-center m-0 p-0 position-absolute"}
          icon={AboutIcon}
          alt={"About Map"}
          clickHandler={() => {
            toggleAboutModal(!showAboutModal);
          }}
        />
        <Control
          style={"Header__assist d-flex justify-content-evenly align-items-center m-0 p-0 position-absolute"}
          icon={HelpIcon}
          alt={"About Map"}
          clickHandler={() => {
            toggleIntroModal(!showIntroModal);
          }}
        />
      </div>
    </header>
  );
};

export default Header;
