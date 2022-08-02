import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom';
import CopyIcon from '../../assets/icons/copy-icon.svg';

const ShareModal = ({ url, handleClose, show }) => {

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    handleClose();
  }

  return (
    <>
      <Modal
        className="Modal"
        show={show}
        onHide={handleClose}
      >
        <Modal.Title>
          <span className="Modal__title">Share the Map</span>
        </Modal.Title>
        <Modal.Body>
          <p>Click below to copy the map url to share.</p>
          <InputGroup className="mb-3">
            <Form.Control type="text" value={url} readOnly></Form.Control>
            <Button
              className='share-button'
              variant="outline-secondary"
              onClick={copyUrl}>
              <img src={CopyIcon} alt="Copy URL" />
            </Button>
          </InputGroup>
          <p>
            To download the CSV and Shapefiles for these trails, visit <Link to={{ pathname: "https://datacommon.mapc.org/browser/Transportation/Bicycle%20and%20Pedestrian%20Facilities" }} target="_blank">MAPC's DataCommon</Link>
          </p>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ShareModal;