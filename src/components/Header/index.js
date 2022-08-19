import React, { useContext } from "react";
import { ModalContext } from "../../App";
import Control from "../Map/Control";
import AboutIcon from "../../assets/icons/about-icon.svg";
import ContributeIcon from "../../assets/icons/contribute-icon.svg";
import HelpIcon from "../../assets/icons/help-icon.svg";

const Header = () => {
  const { showAboutModal, toggleAboutModal,
    showContributeModal, toggleContributeModal,
    showIntroModal, toggleIntroModal } = useContext(ModalContext);

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
        <Control
          style={"Header__contribute"}
          icon={ContributeIcon}
          alt={"Contribute Map"}
          clickHandler={() => { toggleContributeModal(!showContributeModal) }} />
        <Control
          style={"Header__about"}
          icon={AboutIcon}
          alt={"About Map"}
          clickHandler={() => { toggleAboutModal(!showAboutModal) }} />
        <Control
          style={"Header__assist"}
          icon={HelpIcon}
          alt={"About Map"}
          clickHandler={() => { toggleIntroModal(!showIntroModal) }} />
      </div>
    </header>
  )
};

export default Header;

