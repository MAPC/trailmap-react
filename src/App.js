import React, { createContext, useState } from "react";
import Map from "./components/Map";
import Header from "./components/Header";
import IntroModal from "./components/Modals/IntroModal";
import ContributeModal from "./components/Modals/ContributeModal";
import AboutModal from "./components/Modals/AboutModal";
import "./styles/App.scss";
import LayerData from "./data/LayerData";

export const ModalContext = createContext();
export const LayerContext = createContext();


const App = () => {
  const basemaps = LayerData.basemap;
  const existingTrails = LayerData.existing;
  const proposedTrails = LayerData.proposed;

  const [showIntroModal, toggleIntroModal] = useState(true)
  const [showAboutModal, toggleAboutModal] = useState(false)
  const [showContributeModal, toggleContributeModal] = useState(false)
  const [showShareModal, toggleShareModal] = useState(false)
  const [showGlossaryModal, toggleGlossaryModal] = useState(false)

  const [trailLayers, setTrailLayers] = useState([]);
  const [proposedLayers, setProposedLayers] = useState([]);
  const [baseLayer, setBaseLayer] = useState(basemaps[0]);

  return (
    <div className="App">
      <div className="App-wrapper">
        <ModalContext.Provider value={{
          showIntroModal, toggleIntroModal,
          showAboutModal, toggleAboutModal,
          showContributeModal, toggleContributeModal,
          showShareModal, toggleShareModal,
          showGlossaryModal, toggleGlossaryModal
        }}>
          <Header />
          <AboutModal />
          <ContributeModal />
          <LayerContext.Provider value={{
            trailLayers, setTrailLayers,
            proposedLayers, setProposedLayers,
            baseLayer, setBaseLayer,
            basemaps, existingTrails, proposedTrails
          }}>
            <IntroModal />
            <Map />
          </LayerContext.Provider>
        </ModalContext.Provider>
      </div>
    </div>
  );
};

export default App;
