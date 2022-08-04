import React, { createContext, useState } from "react";
import Map from "./components/Map";
import Header from "./components/Header";
import IntroModal from './components/Modals/IntroModal';
import ContributeModal from './components/Modals/ContributeModal';
import AboutModal from './components/Modals/AboutModal';
import './styles/App.scss';

export const ModalContext = createContext();

const App = () => {
  const [showIntroModal, toggleIntroModal] = useState(true)
  const [showAboutModal, toggleAboutModal] = useState(false)
  const [showContributeModal, toggleContributeModal] = useState(false)
  const [showShareModal, toggleShareModal] = useState(false)
  const [showGlossaryModal, toggleGlossaryModal] = useState(false)

  const [cannedMap, setCannedMap] = useState({ baseLayer: '', trailLayers: [] });

  const setMap = (mapLayers) => {
    setCannedMap(mapLayers);
  }

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
          <IntroModal setMap={setMap} />
          <Map cannedMap={cannedMap} />
        </ModalContext.Provider>
      </div>
    </div>
  );
};

export default App;
