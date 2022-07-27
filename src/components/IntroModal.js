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
          <h1>Welcome to Trailmap!</h1>
        </Modal.Title>
        <Modal.Body>
          <h4>Metro Boston's Regional Walking and Cycling Map</h4>
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