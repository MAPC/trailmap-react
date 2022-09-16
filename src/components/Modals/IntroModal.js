import React, { useContext, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";

const IntroModal = () => {
  const { showIntroModal, toggleIntroModal } = useContext(ModalContext);
  const { basemaps, setBaseLayer, setTrailLayers } = useContext(LayerContext);
  const [assist, toggleAssist] = useState(false);


  const handleCannedMap = (mapType) => {
    const setMap = (mapLayers) => {
      setBaseLayer(basemaps.find(bm => bm.id == mapLayers.baseLayer));
      setTrailLayers(mapLayers.trailLayers);
    };

    switch (mapType) {
      case "hiking": setMap({ baseLayer: "terrain", trailLayers: ["unimprovedPaths", "naturalSurfaceFootway"] }); break;
      case "biking": setMap({ baseLayer: "streets", trailLayers: ["bikeLane", "protectedBikeLane", "pavedPaths", "unimprovedPaths"] }); break;
      case "walking": setMap({ baseLayer: "streets", trailLayers: ["pavedPaths", "pavedFootway", "unimprovedPaths"] }); break;
      default: break;
    }
    toggleIntroModal(!showIntroModal);
  };

  return (
    <Modal
      className="Modal"
      show={showIntroModal}
      onHide={() => { toggleIntroModal(!showIntroModal); }}>
      <Modal.Title>
        <span className="Modal__title text-center d-block mt-1 mb-1 ms-2 me-2 p-3 lh-lg">Welcome to Trailmap!</span>
        <span className="Modal__subtitle text-center d-block mt-1 mb-1 ms-2 me-2 p-3">Metro Boston's Regional Walking and Cycling Map</span>
      </Modal.Title>
      <Modal.Body className="Modal__body text-center">
        {!assist &&
          <>
            <Button
              className="intro-button mb-2"
              variant="primary"
              onClick={() => { toggleAssist(!assist); }}>
              Help Me Get Started
            </Button>
            <Button
              className="intro-button m-2"
              variant="primary"
              onClick={() => { toggleIntroModal(!showIntroModal); }}>
              Show me Everything
            </Button>
          </>}
        {assist && <>
          I'm interested in:
          <div>
            <Button
              className="intro-button m-2"
              variant="primary"
              onClick={() => { handleCannedMap("biking"); }}>
              Biking
            </Button>
            <Button
              className="intro-button m-2"
              variant="primary"
              onClick={() => { handleCannedMap("hiking"); }}>
              Hiking
            </Button>
            <Button
              className="intro-button m-2"
              variant="primary"
              onClick={() => { handleCannedMap("walking"); }}>
              Walking
            </Button>
          </div>
        </>}
      </Modal.Body>
      <Modal.Footer>
        <span className="Modal__footer text-center p-1">Trailmaps is always looking for new and improved data from the community. We encourage everyone to submit up-to-date infomration on individual trails so we can continue to improve this dataset. Learn more about trailmaps and continuing here.</span>
        <span className="Modal__disclaimer p-1 fst-italic">Disclaimer: The data herein is provided for informational purposes only. MAPC makes no warranties, either expressed or implied, and assumes no responsibility for its completeness or accuracy. Users assume all responsibility and risk associated with use of the map and agree to indemnify and hold harmless MAPC with respect to any and all claims and demands that may arise resulting from use of this map.</span>
      </Modal.Footer>
    </Modal>
  );
};

export default IntroModal;