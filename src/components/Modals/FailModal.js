import React, { useContext, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { ModalContext } from "../../App";
import axios from "axios";

const FailModal = () => {
  const { showFailModal, toggleFailModal } = useContext(ModalContext);

  return (
    <Modal
      className="Modal"
      show={showFailModal}
      onHide={() => {
        toggleFailModal(!showFailModal);
      }}
    >
      <Modal.Title>
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">
          Suggestion Request <span className="fw-bold fst-italic fail-label">FAILED</span>
        </span>
      </Modal.Title>
      <Modal.Body className="Modal__body text-center">
        <span>
          <span>
            Sadly the update request you submitted failed, please try again or contact us at:{" "}
            <span className="fst-italic">digitalservices@mapc.org</span> <br />
          </span>
        </span>
      </Modal.Body>
      <Modal.Footer>
        <span className="Modal__disclaimer p-1 fst-italic">
          Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either
          expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all
          responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with
          respect to any and all claims and demands that may arise resulting from use of this map.
        </span>
      </Modal.Footer>
    </Modal>
  );
};

export default FailModal;
