import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const ShareModal = ({ url, handleClose, show }) => {

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    handleClose();
  }

  return (
    <>
      <Modal
        className="ShareModal"
        show={show}
        onHide={handleClose}
      >
        <Modal.Title>
          <h1>Share the Map</h1>
        </Modal.Title>
        <Modal.Body>
          Click below to copy the map url to share.
          <Button
            variant="primary"
            onClick={copyUrl}>
            Copy Link
          </Button>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ShareModal;