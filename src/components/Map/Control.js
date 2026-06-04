import React from "react";

const Control = ({ style, icon, iconClass, alt, clickHandler }) => {
  return (
    <button
      className={style}
      onClick={clickHandler}
      type="button"
      aria-label={alt}
    >
      {iconClass ? (
        <i className={iconClass} aria-hidden="true" />
      ) : (
        <img src={icon} alt={alt} />
      )}
    </button>
  );
};

export default Control;