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
  const { showContributeModal, toggleContributeModal } = useContext(ModalContext);

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    toggleShareModal(false);
  };

  return (
    <Modal
      className="Modal"
      dialogClassName="mx-auto"
      show={showShareModal}
      onHide={() => {
        toggleShareModal(false);
      }}
    >
      <Modal.Title>
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">Share the Map</span>
      </Modal.Title>
      <Modal.Body className="Modal__body text-center">
        <span>Click below to copy the map URL to share.</span>
        <InputGroup className="m-2">
          <Form.Control type="text" value={url} readOnly></Form.Control>
          <Button className="share-button p-0 d-flex align-items-center" variant="outline-secondary" onClick={copyUrl}>
            <img src={CopyIcon} alt="Copy URL" />
          </Button>
        </InputGroup>
        <span>
          To download the CSV and Shapefiles for these trails, visit{" "}
          <a
            href="https://datacommon.mapc.org/browser/Transportation/Bicycle%20and%20Pedestrian%20Facilities"
            target="_blank"
          >
            MAPC's DataCommon
          </a>
        </span>
      </Modal.Body>
      <span className="text-center direct-download">Direct Downloads</span>
      <ul className="text-center direct-download-links">
        <li className="text-left direct-download-link">
          <span className="direct-download-link-left">Walking Trails (Lines)</span>
          <div className="direct-download-link-right">
            <a href="https://datacommon.mapc.org/csv?table=mapc.trans_walking_trails&database=gisdata" target="_blank">
              <Button className="direct-download-link-btn">.csv</Button>
            </a>
            <a
              href="https://datacommon.mapc.org/shapefile?table=gisdata.mapc.trans_walking_trails&database=gisdata"
              target="_blank"
            >
              <Button className="direct-download-link-btn">.shp</Button>
            </a>
          </div>
        </li>
        <li className="text-left direct-download-link">
          <span className="direct-download-link-left">Bicycle Facilities (Lines)</span>
          <div className="direct-download-link-right">
            <a href="https://datacommon.mapc.org/csv?table=mapc.trans_bike_facilities&database=gisdata" target="_blank">
              <Button className="direct-download-link-btn">.csv</Button>
            </a>
            <a
              href="https://datacommon.mapc.org/shapefile?table=gisdata.mapc.trans_bike_facilities&database=gisdata"
              target="_blank"
            >
              <Button className="direct-download-link-btn">.shp</Button>
            </a>
          </div>
        </li>
        <li className="text-left direct-download-link">
          <span className="direct-download-link-left">Land Line Systems (Lines)</span>
          <div className="direct-download-link-right">
            <a
              href="https://datacommon.mapc.org/csv?table=mapc.trans_land_line_systems&database=gisdata"
              target="_blank"
            >
              <Button className="direct-download-link-btn">.csv</Button>
            </a>
            <a
              href="https://datacommon.mapc.org/shapefile?table=gisdata.mapc.trans_land_line_systems&database=gisdata"
              target="_blank"
            >
              <Button className="direct-download-link-btn">.shp</Button>
            </a>
          </div>
        </li>
        <li className="text-left direct-download-link">
          <span className="direct-download-link-left">Shared Use Trails (Lines)</span>
          <div className="direct-download-link-right">
            <a
              href="https://datacommon.mapc.org/csv?table=mapc.trans_shared_use_paths&database=gisdata"
              target="_blank"
            >
              <Button className="direct-download-link-btn">.csv</Button>
            </a>
            <a
              href="https://datacommon.mapc.org/shapefile?table=gisdata.mapc.trans_shared_use_paths&database=gisdata"
              target="_blank"
            >
              <Button className="direct-download-link-btn">.shp</Button>
            </a>
          </div>
        </li>
      </ul>
      <Modal.Footer>
        <span className="Modal__footer text-center">
          Trailmaps is always looking for new and improved data from the community. We encourage everyone to submit
          up-to-date infomration on individual trails so we can continue to improve this dataset. Learn more about
          trailmaps and continuing{" "}
          <a
            onClick={() => {
              toggleShareModal(false);
              toggleContributeModal(true);
            }}
            className="modal-footer-link"
          >
            here
          </a>
          .
        </span>
        <span className="Modal__disclaimer fst-italic">
          Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either
          expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all
          responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with
          respect to any and all claims and demands that may arise resulting from use of this map.
        </span>
      </Modal.Footer>
    </Modal>
  );
};

export default ShareModal;
