import React, { useState } from "react";
import Map from "./components/Map";
import Header from "./components/Header";
import IntroModal from './components/Modals/IntroModal';
import ContributeModal from './components/Modals/ContributeModal';
import AboutModal from './components/Modals/AboutModal';
import './styles/App.scss';

const App = () => {
  const [showAboutModal, toggleAboutModal] = useState(false)
  const [showContributeModal, toggleContributeModal] = useState(false)

  const handleAboutModal = () => {
    toggleAboutModal(!showAboutModal);
  };

  const handleContributeModal = () => {
    toggleContributeModal(!showContributeModal);
  };

  return (
    <div className="App">
      <div className="App-wrapper">
        <Header handleAboutModal={handleAboutModal} handleContributeModal={handleContributeModal} />
        <AboutModal handleAboutModal={handleAboutModal} showAboutModal={showAboutModal} />
        <ContributeModal handleContributeModal={handleContributeModal} showContributeModal={showContributeModal} />
        <IntroModal />
        <Map />
      </div>
    </div>
  );
};

export default App;
