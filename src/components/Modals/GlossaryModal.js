import React, { useContext } from "react";
import Modal from "react-bootstrap/Modal";
import { ModalContext } from "../../App";

const GlossaryModal = () => {
  const { showGlossaryModal, toggleGlossaryModal } = useContext(ModalContext);

  return (
    <Modal className="Modal" show={showGlossaryModal} onHide={() => toggleGlossaryModal(!showGlossaryModal)}>
      <Modal.Title>
        <span className="Modal__title d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg text-center">Glossary of Trail Types</span>
      </Modal.Title>
      <Modal.Body>
        <span className="Modal__body">
          The following is a brief description on the different trail types found in the control panel. Proposed trails
          (dashed lines) of each type represents future trails:
        </span>
        <ul className="Modal__list text-left p-1 mb-0">
          <li className="mt-4">
            <span className="ControlPanel_type_button__pavedPaths">Paved Shared Use</span>: Hard packed accessible
            surface, typically asphalt or stonedust
          </li>
          <li className="mt-2">
            <span className="ControlPanel_type_button__unimprovedPaths">Unimproved Shared Use</span>: Future paved
            paths, currently with an unimproved natural surface
          </li>
          <li className="mt-2 mb-2">
            <span className="ControlPanel_type_button__bikeLane">Bike Lane</span>: Striped lane within the roadway
            adjacent to traffic
          </li>
          <li className="mt-2 mb-2">
            <span className="ControlPanel_type_button__protectedBikeLane">Protected Bike Lane</span>: Physically
            separated from motor vehicle traffic
          </li>
          <li className="mt-2 mb-2">
            <span className="ControlPanel_type_button__pavedFootway">Paved Foot Path</span>: Hard surface path,
            typically in city park or campus environments
          </li>
          <li className="mt-2 mb-4">
            <span className="ControlPanel_type_button__naturalSurfaceFootway">Natural Surface Path</span>: Hiking trail,
            typically found in conservation areas
          </li>
        </ul>
        <span className="Modal__body">
          To find out more about the details of the Regional Greenway Network and how that's represented, click{" "}
          <span className="Modal__emphasize">Show Landline Greenway Layer</span> in the control panel to see the map
          legend
        </span>
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
