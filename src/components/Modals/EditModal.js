import React, { useContext, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";
import { ModalContext } from "../../App";
import axios from "axios";

const EditModal = (trailObj) => {
  const { showEditModal, toggleEditModal, showSuccessModal, toggleSuccessModal, showFailModal, toggleFailModal } =
    useContext(ModalContext);

  let trailID = "N/A";
  let trailName = "N/A";
  let trailLayerType = "N/A";
  let trailSteward = "N/A";
  let trailOpenDate = "N/A";

  // const [trailID, setTrailID] = useState("42");
  // const [trailName, setTrailName] = useState("yellow brick road");
  // const [trailLayerType, setTrailLayerType] = useState("paved path");
  // const [trailSteward, setTrailSteward] = useState("N/A");
  // const [trailOpenDate, setTrailOpenDate] = useState("10,000 B.C.E");

  if (trailObj.trailObj != null) {
    const trailAttributes = trailObj.trailObj.attributes;
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
    trailOpenDate = trailAttributes["Facility Opening Date"] !== "Null" ? trailAttributes["Facility Opening Date"] : "";
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target),
      formDataObj = Object.fromEntries(formData.entries());

    let data = {
      records: [
        {
          fields: {
            TrailID: Number(trailID),
            TrailName: formDataObj.trailName,
            LayerType: formDataObj.trailLayerType,
            Steward: formDataObj.trailSteward,
            OpenDate: formDataObj.trailOpenDate,
            Attachment: null,
          },
        },
      ],
    };
    const axiosConfig = {
      headers: {
        Authorization: "Bearer patzMGcNLSX5Uz7Po.ba72d4faca195e4a7fb0d17b4c574cc27129aa16eca6a2ffa6595b1ba253f0e6",
        "Content-Type": "application/json",
      },
    };

    axios
      .post("https://api.airtable.com/v0/appoBQic7l6EkcBlQ/tbl1PiXpyw6IFvZtM", data, axiosConfig)
      .then((response) => {
        toggleEditModal(false);
        // request went through and posted to Airtable Base
        if (response.status == 200) {
          toggleSuccessModal(true);
        } else {
          toggleFailModal(true);
        }
      })
      .catch((error) => {
        toggleFailModal(true);
      });
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
          Suggest Trail Record Edit
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
              <Form.Control
                type="text"
                placeholder={trailName}
                defaultValue={trailName}
                className="mb-3"
                name="trailName"
              />

              <Form.Label className="mb-1 text-start modal-form-label">Layer Type:</Form.Label>
              <Form.Select aria-label="dropdown to select trail layer type" className="mb-3" name="trailLayerType">
                <option defaultValue={trailLayerType}>{trailLayerType}</option>
                <option defaultValue="Existing Paved Shared Use Paths">Paved Shared Use Paths</option>
                <option defaultValue="Existing Unimproved Shared Use Paths">Unimproved Shared Use Paths</option>
                <option defaultValue="Existing Bike Lanes">Bike Lanes</option>
                <option defaultValue="Existing Protected Bike Lanes">Protected Bike Lanes</option>
                <option defaultValue="Paved Footway">Paved Footway</option>
                <option defaultValue="Natural Surface Footway">Natural Surface Footway</option>
              </Form.Select>

              <Form.Label className="mb-1 text-start modal-form-label">Trail Steward:</Form.Label>
              <Form.Control
                type="text"
                placeholder={trailSteward}
                defaultValue={trailSteward}
                className="mb-3"
                name="trailSteward"
              />

              <Form.Label className="mb-1 text-start modal-form-label">Opening Date:</Form.Label>
              <Form.Control
                type="text"
                placeholder={trailOpenDate}
                defaultValue={trailOpenDate}
                className="mb-2"
                name="trailOpenDate"
              />
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
