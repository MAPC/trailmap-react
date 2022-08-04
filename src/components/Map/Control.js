import React from 'react';

const Control = ({ feature, icon, alt, clickHandler }) => {
  return (<button
    className={`Map_${feature}`}
    onClick={clickHandler}
  >
    <img src={icon} alt={alt} />
  </button >);
}

export default Control;