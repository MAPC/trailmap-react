import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

const AboutModal = ({ handleAboutModal, showAboutModal }) => {

  return (
    <>
      <Modal
        className="IntroModal"
        show={showAboutModal}
        onHide={handleAboutModal}>
        <Modal.Header closeButton>
        </Modal.Header>
        <Modal.Title>
          <span class="IntroModal__title">About Trailmap</span>
        </Modal.Title>
        <Modal.Body>
          <span class="IntroModal__subtitle">Metro Boston's Regional Walking and Cycling Map</span>
          This map is a comprehensive map of pedestrian and bicycle facilities throughout the MAPC region and beyond. The data on this map tool has been collected from a number of sources including city/town trail data, land trusts, DCR, MassDOT, and other sources.
        </Modal.Body>
        <Modal.Footer>
          Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with respect to any and all claims and demands that may arise resulting from use of this map.
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AboutModal;