import React from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const Control = ({
  style,
  icon,
  iconClass,
  alt,
  clickHandler,
  tooltip,
  tooltipId,
  tooltipPlacement = "bottom",
}) => {
  const button = (
    <button
      className={style}
      onClick={clickHandler}
      type="button"
      aria-label={alt}
    >
      {iconClass ? (
        <i className={iconClass} aria-hidden="true" />
      ) : (
        <img src={icon} alt="" aria-hidden="true" />
      )}
    </button>
  );

  if (!tooltip) {
    return button;
  }

  return (
    <OverlayTrigger
      placement={tooltipPlacement}
      popperConfig={{
        strategy: "fixed",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: tooltipPlacement === "left" ? [0, 10] : [0, 14],
            },
          },
          {
            name: "flip",
            options: {
              fallbackPlacements: tooltipPlacement === "left" ? ["left", "bottom"] : ["bottom", "left"],
            },
          },
        ],
      }}
      overlay={
        <Tooltip id={tooltipId || `control-tooltip-${alt}`} className="Header__tooltip">
          {tooltip}
        </Tooltip>
      }
    >
      {button}
    </OverlayTrigger>
  );
};

export default Control;