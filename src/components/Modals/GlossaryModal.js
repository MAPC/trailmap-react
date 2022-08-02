import React from 'react';
import Modal from 'react-bootstrap/Modal';

const GlossaryModal = ({ handleClose, show }) => {

  return (
    <>
      <Modal
        className="Modal"
        show={show}
        onHide={handleClose}>
        <Modal.Title>
          <span className="Modal__title">Glossary of Trail Types</span>
        </Modal.Title>
        <Modal.Body>
          <ul className="Modal__list">
            <li><span>Paved Paths</span>: Hard packed accessible surface, typically asphalt or stonedust</li>
            <li><span>Unimproved Paths</span>: Future paved paths, currently with an unimproved natural surface</li>
            <li><span>Protected Bike Lane</span>: Physically separated from motor vehicle traffic</li>
            <li><span>Bike Lane</span>: Striped lane within the roadway adjacent to traffic</li>
            <li><span>Paved Footway</span>: Hard surface path, typically in city park or campus environments</li>
            <li><span>Natural Surface Footway</span>: Hiking trail, typically found in conservation areas</li>
          </ul>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default GlossaryModal;