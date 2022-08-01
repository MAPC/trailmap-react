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
          This map is a comprehensive map of pedestrian and bicycle facilities throughout the MAPC region and beyond. The data on this map tool has been collected from a number of sources including city/town trail data, land trusts, DCR, MassDOT, and other sources..
        </Modal.Body>
        <Modal.Footer>
          Trailmaps is always looking for new and improved data from the community. We encourage everyone to submit up-to-date infomration on individual trails so we can continue to improve this dataset. Learn more about trailmaps and continuing here.
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AboutModal;