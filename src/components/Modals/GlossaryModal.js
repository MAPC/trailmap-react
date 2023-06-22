import React, { useContext } from "react";
import Modal from "react-bootstrap/Modal";
import { ModalContext } from "../../App";

const GlossaryModal = () => {
  const { showGlossaryModal, toggleGlossaryModal } = useContext(ModalContext);

  return (
    <Modal
      className="Modal"
      dialogClassName="mx-auto"
      show={showGlossaryModal}
      onHide={() => toggleGlossaryModal(!showGlossaryModal)}
    >
      <Modal.Title>
        <span className="Modal__title d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg text-center">Glossary of Trail Types</span>
      </Modal.Title>
      <Modal.Body>
        <span className="Modal__body">
          The following is a brief description on the different trail types. Proposed trails of each type reprepresent
          future trails.
        </span>
        <ul className="Modal__list text-left p-1 mb-0">
          <li>
            <span>Paved Paths</span>: Hard packed accessible surface, typically asphalt or stonedust
          </li>
          <li>
            <span>Unimproved Paths</span>: Future paved paths, currently with an unimproved natural surface
          </li>
          <li>
            <span>Protected Bike Lane</span>: Physically separated from motor vehicle traffic
          </li>
          <li>
            <span>Bike Lane</span>: Striped lane within the roadway adjacent to traffic
          </li>
          <li>
            <span>Paved Footway</span>: Hard surface path, typically in city park or campus environments
          </li>
          <li>
            <span>Natural Surface Footway</span>: Hiking trail, typically found in conservation areas
          </li>
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <span className="Modal__disclaimer p-1 fst-italic">
          Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either
          expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all
          responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with
          respect to any and all claims and demands that may arise resulting from use of this map.
        </span>
      </Modal.Footer>
    </Modal>
  );
};

export default GlossaryModal;
