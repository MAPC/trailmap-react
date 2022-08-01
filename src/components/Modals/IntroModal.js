import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const IntroModal = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Modal
        className="IntroModal"
        show={show}
        onHide={handleClose}>
        <Modal.Header closeButton>
        </Modal.Header>
        <Modal.Title>
          <span class="IntroModal__title">Welcome to Trailmap!</span>
        </Modal.Title>
        <Modal.Body>
          <span class="IntroModal__subtitle">Metro Boston's Regional Walking and Cycling Map</span>
          <Button
            variant="primary"
            onClick={handleClose}>
            Help Me Get Started
          </Button>
          <Button
            variant="primary"
            onClick={handleClose}>
            Show me Everything
          </Button>
        </Modal.Body>
        <Modal.Footer>
          Trailmaps is always looking for new and improved data from the community. We encourage everyone to submit up-to-date infomration on individual trails so we can continue to improve this dataset. Learn more about trailmaps and continuing here.
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default IntroModal;