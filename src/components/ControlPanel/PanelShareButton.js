import React, { useContext } from "react";
import { ModalContext } from "../../App";

const PanelShareButton = () => {
  const { showShareModal, toggleShareModal } = useContext(ModalContext);

  return (
    <div className="ControlPanelShare">
      <button
        type="button"
        className="ControlPanelShare__btn"
        onClick={() => toggleShareModal(!showShareModal)}
        aria-label="Share map or download trail data"
      >
        <span className="ControlPanelShare__icon" aria-hidden="true">
          <i className="bi bi-share-fill" />
        </span>
        <span className="ControlPanelShare__text">
          <span className="ControlPanelShare__label">Share &amp; download</span>
          <span className="ControlPanelShare__hint">Get trail data files</span>
        </span>
        <i className="bi bi-chevron-right ControlPanelShare__arrow" aria-hidden="true" />
      </button>
    </div>
  );
};

export default PanelShareButton;
