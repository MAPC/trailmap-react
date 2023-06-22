import React, { useContext } from "react";
import Modal from "react-bootstrap/Modal";
import { Link } from "react-router-dom";
import { ModalContext } from "../../App";

const ContributeModal = () => {
  const { showContributeModal, toggleContributeModal } =
    useContext(ModalContext);

  return (
    <Modal
      className="Modal"
      dialogClassName="mx-auto"
      show={showContributeModal}
      onHide={() => {
        toggleContributeModal(!showContributeModal);
      }}
      centered
    >
      <Modal.Title>
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">
          Contribute to Trailmap
        </span>
      </Modal.Title>
      <Modal.Body className="Modal__body text-center">
        <span>
          We welcome contributions to this map including adding to and editing
          the data! We have an online editing tool available for you to use. To
          found out how to access the editing functions, please contact David
          Loutzenheiser at:{" "}
          <Link
            to={{ pathname: "mailto:dloutzenheiser@mapc.org" }}
            target="_blank"
          >
            dloutzenheiser@mapc.org
          </Link>
        </span>
      </Modal.Body>
      <Modal.Footer>
        <span className="Modal__disclaimer p-1 fst-italic">
          Disclaimer: The data herein is provided for informational purposes
          only. MAPC makes no warranties, either expressed or implied, and
          assumes no responsibility for its completeness or accuracy. Users
          assume all responsibility and risk associated with use of the map and
          agree to indemnify and hold harmless MAPC with respect to any and all
          claims and demands that may arise resulting from use of this map.
        </span>
      </Modal.Footer>
    </Modal>
  );
};

export default ContributeModal;
