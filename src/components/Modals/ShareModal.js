import React, { useContext } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";
import CopyIcon from "../../assets/icons/copy-icon.svg";
import { Link } from "react-router-dom";
import { ModalContext } from "../../App";

const ShareModal = ({ url }) => {
  const { showShareModal, toggleShareModal } = useContext(ModalContext);

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    toggleShareModal(false);
  };

  return (
    <Modal
      className="Modal"
      show={showShareModal}
      onHide={() => { toggleShareModal(false); }}
    >
      <Modal.Title>
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">Share the Map</span>
      </Modal.Title>
      <Modal.Body className="Modal__body text-center">
        <span>Click below to copy the map url to share.</span>
        <InputGroup className="m-2">
          <Form.Control type="text" value={url} readOnly></Form.Control>
          <Button
            className="share-button p-0 d-flex align-items-center"
            variant="outline-secondary"
            onClick={copyUrl}>
            <img src={CopyIcon} alt="Copy URL" />
          </Button>
        </InputGroup>
        <span>To download the CSV and Shapefiles for these trails, visit <Link to={{ pathname: "https://datacommon.mapc.org/browser/Transportation/Bicycle%20and%20Pedestrian%20Facilities" }} target="_blank">MAPC's DataCommon</Link>
        </span>
      </Modal.Body>
      <Modal.Footer>
        <span className="Modal__footer text-center">Trailmaps is always looking for new and improved data from the community. We encourage everyone to submit up-to-date infomration on individual trails so we can continue to improve this dataset. Learn more about trailmaps and continuing here.</span>
        <span className="Modal__disclaimer fst-italic">Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with respect to any and all claims and demands that may arise resulting from use of this map.</span>
      </Modal.Footer>
    </Modal>
  );
};

export default ShareModal;