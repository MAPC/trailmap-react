import React from "react";

const Header = () => {
  return (
    <header className="Header">
      <img src="https://www.mapc.org/wp-content/themes/mapc/assets/images/mapc-logo.svg" className="Header__image" alt="Metropolitan Area Planning Council" />
      <h1 className="Header__title">
        <span className="Header__title--bold">Trailmap<span className="Header__title--mobile-remove">: </span></span><span className="Header__title--mobile-remove">Metro Boston's Regional Walking and Cycling Map</span>
      </h1>
    </header>
  )
};

export default Header;

