import React, { useContext, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";
import { ModalContext } from "../../App";

const EditModal = (trailObj) => {
  const { showEditModal, toggleEditModal } = useContext(ModalContext);

  const [trailID, setTrailID] = useState("42");
  const [trailName, setTrailName] = useState("yellow brick road");
  const [trailLayerType, setTrailLayerType] = useState("paved path");
  const [trailSteward, setTrailSteward] = useState("N/A");
  const [trailIDDate, setTrailIDDate] = useState("10,000 B.C.E");

  console.log(trailObj);

  if (typeof(trailObj) !== "undefined") {
    setTrailID(trailObj.attributes.objectid);
    setTrailName(trailObj.attributes.)
  }

  const handleSubmit = (event) => {
    return;
  };

  return (
    <Modal
      className="Modal"
      show={showEditModal}
      onHide={() => {
        toggleEditModal(!showEditModal);
      }}
    >
      <Modal.Title>
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">Edit Trail Record</span>
      </Modal.Title>
      <Modal.Body className="Modal__body text-center">
        <span>
          Add or Edit Data for trail ID: {trailID}!
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formFile" id="contribute-submit-form">
              <Form.Label>Submit Data:</Form.Label>
              <Form.Control type="file" />
            </Form.Group>
            <Button type="submit" id="contribute-submit-button">
              Submit
            </Button>
          </Form>
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

export default EditModal;
