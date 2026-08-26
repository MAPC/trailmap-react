import React, { useContext } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useLocation } from "react-router-dom";
import { ModalContext } from "../../App";

const ShareModal = () => {
  const location = useLocation();
  const { showShareModal, toggleShareModal } = useContext(ModalContext);
  const { toggleContributeModal } = useContext(ModalContext);

  // Hide download section in Community Trails Profile
  const isCommunityTrailsProfile =
    location.pathname === "/communityTrailsProfile";

  return (
    <Modal
      className="Modal ShareModal"
      dialogClassName="ShareModal__dialog mx-auto"
      show={showShareModal}
      onHide={() => {
        toggleShareModal(false);
      }}
      centered
    >
      <Modal.Title>
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">
          Share the Map
        </span>
      </Modal.Title>
      <Modal.Body className="Modal__body text-center">
        {!isCommunityTrailsProfile && (
          <>
            <span>
              To download the CSV, Shapefiles, and GeoJSON for these trails, visit{" "}
              <a
                href="https://datacommon.mapc.org/browser?geos=all&category=Transportation&q=lines"
                target="_blank"
                rel="noreferrer"
              >
                MAPC's DataCommon
              </a>
            </span>
          </>
        )}
      </Modal.Body>
      {!isCommunityTrailsProfile && (
        <>
          <span className="text-center direct-download">Direct Downloads</span>
          <ul className="text-center direct-download-links">
            <li className="text-left direct-download-link">
              <span className="direct-download-link-left">
                Walking Trails (Lines)
              </span>
              <div className="direct-download-link-right">
                <a
                  href="https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_walking_trails&format=csv&useMetadataColumns=false"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.csv</Button>
                </a>
                <a
                  href="https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_walking_trails&format=shapefile"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.shp</Button>
                </a>
                <a
                  href="https://staging.datacommon-react.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_walking_trails&format=geojson&useMetadataColumns=true"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.geojson</Button>
                </a>
              </div>
            </li>
            <li className="text-left direct-download-link">
              <span className="direct-download-link-left">
                Bicycle Facilities (Lines)
              </span>
              <div className="direct-download-link-right">
                <a
                  href="https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_bike_facilities&format=csv&useMetadataColumns=false"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.csv</Button>
                </a>
                <a
                  href="https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_bike_facilities&format=shapefile"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.shp</Button>
                </a>
                <a
                  href="https://staging.datacommon-react.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_bike_facilities&format=geojson&useMetadataColumns=true"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.geojson</Button>
                </a>
              </div>
            </li>
            <li className="text-left direct-download-link">
              <span className="direct-download-link-left">
                Land Line Systems (Lines)
              </span>
              <div className="direct-download-link-right">
                <a
                  href="https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_land_line_systems&format=csv&useMetadataColumns=false"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.csv</Button>
                </a>
                <a
                  href="https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_land_line_systems&format=shapefile"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.shp</Button>
                </a>
                <a
                  href="https://staging.datacommon-react.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_land_line_systems&format=geojson&useMetadataColumns=true"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.geojson</Button>
                </a>
              </div>
            </li>
            <li className="text-left direct-download-link">
              <span className="direct-download-link-left">
                Shared Use Trails (Lines)
              </span>
              <div className="direct-download-link-right">
                <a
                  href="https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_shared_use_paths&format=csv&useMetadataColumns=false"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.csv</Button>
                </a>
                <a
                  href="https://datacommon.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_shared_use_paths&format=shapefile"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.shp</Button>
                </a>
                <a
                  href="https://staging.datacommon-react.mapc.org/api/export?token=datacommon&database=gisdata&schema=mapc&table=trans_shared_use_paths&format=geojson&useMetadataColumns=true"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="direct-download-link-btn">.geojson</Button>
                </a>
              </div>
            </li>
          </ul>
        </>
      )}
      <Modal.Footer>
        <span className="Modal__footer text-center">
          Trailmaps is always looking for new and improved data from the
          community. We encourage everyone to submit up-to-date infomration on
          individual trails so we can continue to improve this dataset. Learn
          more about trailmaps and continuing{" "}
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
          Disclaimer: The data herein is provided for informational purposes
          only. MAPC makes no warranties, either expressed or implied, and
          assumes no responsibility for its completeness or accuracy. Users
          assume all responsibility and risk associated with use of the map and
          agree to indemnify and hold harmless MAPC with respect to any and all
          claims and demands that may arise resulting from use of this map.
        </span>
      </Modal.Footer>
    </Modal>
  );
};

export default ShareModal;
