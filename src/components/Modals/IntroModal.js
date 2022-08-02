import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const IntroModal = ({ setMap }) => {
  const [show, setShow] = useState(true);
  const [intro, setIntro] = useState(true);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleShowHelp = () => {
    setIntro(!intro);
  }

  return (
    <>
      <Modal
        className="Modal"
        show={show}
        onHide={handleClose}>
        <Modal.Title>
          <span className="Modal__title">Welcome to Trailmap!</span>
        </Modal.Title>
        <Modal.Body>
          {intro &&
            <>
              <span className="Modal__subtitle">Metro Boston's Regional Walking and Cycling Map</span>
              <Button
                className="intro-button"
                variant="primary"
                onClick={handleClose}>
                Help Me Get Started
              </Button>
              <Button
                className="intro-button"
                variant="primary"
                onClick={handleClose}>
                Show me Everything
              </Button>
              <p>Trailmaps is always looking for new and improved data from the community. We encourage everyone to submit up-to-date infomration on individual trails so we can continue to improve this dataset. Learn more about trailmaps and continuing here.</p>
            </>}
          {!intro && <>
            I'm interested in:
            <Button
              variant="primary"
              onClick={setMap({ baseLayer: 'streets', trailLayers: ['bikeLane', 'protectedBikeLane'] })}>
              Biking
            </Button>
            <Button
              variant="primary"
              onClick={setMap({ baseLayer: 'terrain', trailLayes: ['naturalSurfaceFootway'] })}>
              Hiking
            </Button>
          </>}
        </Modal.Body>
        <Modal.Footer>
          <span className="Modal__footer">Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with respect to any and all claims and demands that may arise resulting from use of this map.</span>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default IntroModal;