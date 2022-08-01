import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';

const ContributeModal = ({ handleContributeModal, showContributeModal }) => {

  return (
    <>
      <Modal
        className="IntroModal"
        show={showContributeModal}
        onHide={handleContributeModal}>
        <Modal.Header closeButton>
        </Modal.Header>
        <Modal.Title>
          <span class="IntroModal__title">Contribute to Trailmap</span>
        </Modal.Title>
        <Modal.Body>
          <span class="IntroModal__subtitle">Metro Boston's Regional Walking and Cycling Map</span>
          We welcome contributions to this map including adding to and editing the data! We have an online editing tool available for you to use. To found out how to access the editing functions, please contact David Loutzenheiser at: <a href="mailto:dloutzenheiser@mapc.org">dloutzenheiser@mapc.org</a>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ContributeModal;