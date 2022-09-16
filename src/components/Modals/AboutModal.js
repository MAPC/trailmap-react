import React, { useContext } from "react";
import Modal from "react-bootstrap/Modal";
import { ModalContext } from "../../App";

const AboutModal = () => {
  const { showAboutModal, toggleAboutModal } = useContext(ModalContext);

  return (
    <Modal
      className="Modal"
      show={showAboutModal}
      onHide={() => toggleAboutModal(!showAboutModal)}>
      <Modal.Title>
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">About Trailmap</span>
        <span className="Modal__subtitle text-center d-block mt-1 mb-1 ms-2 me-2 p-3">Metro Boston's Regional Walking and Cycling Map</span>
      </Modal.Title>
      <Modal.Body>
        <span className="Modal__body text-center">This map is a comprehensive map of pedestrian and bicycle facilities throughout the MAPC region and beyond. The data on this map tool has been collected from a number of sources including city/town trail data, land trusts, DCR, MassDOT, and other sources.</span>
      </Modal.Body>
      <Modal.Footer>
        <span className="Modal__footer text-center p-1">Trailmaps is always looking for new and improved data from the community. We encourage everyone to submit up-to-date infomration on individual trails so we can continue to improve this dataset. Learn more about trailmaps and continuing here.</span>
        <span className="Modal__disclaimer p-1 fst-italic">Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with respect to any and all claims and demands that may arise resulting from use of this map.</span>
      </Modal.Footer>
    </Modal>
  );
};

export default AboutModal;