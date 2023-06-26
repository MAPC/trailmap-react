import React, { useContext, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";
import { ModalContext } from "../../App";

const EditModal = (trailObj) => {
  const { showEditModal, toggleEditModal } = useContext(ModalContext);

  let trailID = "N/A";
  let trailName = "N/A";
  let trailLayerType = "N/A";
  let trailSteward = "N/A";
  let trailIDDate = "N/A";

  // const [trailID, setTrailID] = useState("42");
  // const [trailName, setTrailName] = useState("yellow brick road");
  // const [trailLayerType, setTrailLayerType] = useState("paved path");
  // const [trailSteward, setTrailSteward] = useState("N/A");
  // const [trailIDDate, setTrailIDDate] = useState("10,000 B.C.E");

  console.log(trailObj.trailObj != null);

  if (trailObj.trailObj != null) {
    const trailAttributes = trailObj.trailObj.attributes;
    console.log(trailAttributes);
    trailID =
      typeof trailAttributes.objectid !== "undefined"
        ? trailAttributes.objectid
        : typeof trailAttributes["OBJECTID"] !== "undefined"
        ? trailAttributes["OBJECTID"]
        : "";
    trailName =
      trailAttributes["Regional Name"] !== "Null" && trailAttributes["Regional Name"] !== " "
        ? trailAttributes["Regional Name"]
        : trailAttributes["Property Name"] !== "Null" && trailAttributes["Property Name"] !== " "
        ? trailAttributes["Property Name"]
        : trailAttributes["Local Name"] !== "Null" && trailAttributes["Local Name"] !== " "
        ? trailAttributes["Local Name"]
        : "";
    trailLayerType = trailObj.trailObj.layerName;
    trailSteward =
      trailAttributes["Steward"] !== "Null"
        ? trailAttributes["Steward"]
        : trailAttributes["Owner / Steward"] !== "Null"
        ? trailAttributes["Owner / Steward"]
        : "";
    trailIDDate = trailAttributes["Facility Opening Date"] !== "Null" ? trailAttributes["Facility Opening Date"] : "";
    console.log(trailLayerType);
    console.log(trailID);
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
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">
          Suggest Edit Trail Record
        </span>
      </Modal.Title>
      <Modal.Body className="Modal__body text-center">
        <span>
          <span>
            Submit a form to suggest an <br />
            <span className="fw-bold fst-italic">Addition</span> or
            <span className="fw-bold fst-italic">Edit</span> Data for: <br />
            <span className="fw-bold fst-italic">Trail ID: {trailID}</span>
          </span>

          <Form onSubmit={handleSubmit} className="pt-3">
            <Form.Group controlId="formFile" id="contribute-submit-form">
              <Form.Label className="mb-1 text-start modal-form-label">Trail Name: </Form.Label>
              <Form.Control type="text" placeholder={trailName} className="mb-3" />

              <Form.Label className="mb-1 text-start modal-form-label">Layer Type:</Form.Label>
              <Form.Select aria-label="dropdown to select trail layer type" className="mb-3">
                <option value={trailLayerType}>{trailLayerType}</option>
                <option value="Existing Paved Shared Use Paths">Existing Paved Shared Use Paths</option>
                <option value="Existing Unimproved Shared Use Paths">Existing Unimproved Shared Use Paths</option>
                <option value="Existing Bike Lanes">Existing Bike Lanes</option>
                <option value="Existing Protected Bike Lanes">Existing Protected Bike Lanes</option>
                <option value="Paved Footway">Paved Footway</option>
                <option value="Natural Surface Footway">Natural Surface Footway</option>
              </Form.Select>

              <Form.Label className="mb-1 text-start modal-form-label">Trail Steward:</Form.Label>
              <Form.Control type="text" placeholder={trailSteward} className="mb-3" />

              <Form.Label className="mb-1 text-start modal-form-label">ID Date:</Form.Label>
              <Form.Control type="text" placeholder={trailIDDate} className="mb-2" />
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
