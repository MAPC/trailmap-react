import React from 'react';
import { Link } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';

const ContributeModal = ({ handleContributeModal, showContributeModal }) => {

  return (
    <>
      <Modal
        className="Modal"
        show={showContributeModal}
        onHide={handleContributeModal}>
        <Modal.Title>
          <span className="Modal__title">Contribute to Trailmap</span>
        </Modal.Title>
        <Modal.Body>
          We welcome contributions to this map including adding to and editing the data! We have an online editing tool available for you to use. To found out how to access the editing functions, please contact David Loutzenheiser at: <Link to={{ pathname: "mailto:dloutzenheiser@mapc.org" }} target="_blank">dloutzenheiser@mapc.org</Link>
        </Modal.Body>
        <Modal.Footer>
          <span className="Modal__footer">Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with respect to any and all claims and demands that may arise resulting from use of this map.</span>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ContributeModal;