import React, { useContext } from "react";
import { ModalContext } from "../../App";
import Control from "../Map/Control";
import AboutIcon from "../../assets/icons/about-icon.svg";
import GlossaryIcon from "../../assets/icons/glossary-icon.svg";
import HelpIcon from "../../assets/icons/help-icon.svg";
import { HEADER_ACTION_ITEMS } from "./headerMenuConfig";

const ACTION_ICONS = {
  about: AboutIcon,
  glossary: GlossaryIcon,
  help: HelpIcon,
};

const HeaderActions = ({ showTooltips = true }) => {
  const { toggleHeaderModal } = useContext(ModalContext);

  return (
    <div className="Header__actions">
      {HEADER_ACTION_ITEMS.map((item) => (
        <Control
          key={item.id}
          style={`Header__action Header__${item.id}`}
          iconClass={item.iconClass ? `bi ${item.iconClass}` : undefined}
          icon={item.iconKey ? ACTION_ICONS[item.iconKey] : undefined}
          alt={item.label}
          tooltip={showTooltips ? item.label : undefined}
          tooltipId={`header-${item.id}-tooltip`}
          tooltipPlacement="bottom"
          clickHandler={() => toggleHeaderModal(item.modal)}
        />
      ))}
    </div>
  );
};

export default HeaderActions;
