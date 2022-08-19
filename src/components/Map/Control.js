import React from "react";

const Control = ({ style, icon, alt, clickHandler }) => {
  return (<button
    className={style}
    onClick={clickHandler}
  >
    <img src={icon} alt={alt} />
  </button >);
}

export default Control;