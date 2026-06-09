import React from "react";

const MapToolbarButton = ({ iconClass, label, isActive, isOpen, onClick, ariaLabel }) => {
  return (
    <button
      type="button"
      className={`MapToolbarButton${isActive ? " MapToolbarButton--active" : ""}`}
      onClick={onClick}
      aria-label={ariaLabel || label}
      aria-expanded={isOpen}
    >
      <i className={`MapToolbarButton__icon ${iconClass}`} aria-hidden="true" />
      <span className="MapToolbarButton__label">{label}</span>
    </button>
  );
};

export default MapToolbarButton;
