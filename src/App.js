import React, { useState } from "react";
import Map from "./components/Map";
import Header from "./components/Header";
import IntroModal from './components/IntroModal';
import AboutModal from './components/AboutModal';
import './styles/App.scss';

const App = () => {
  const [showAboutModal, toggleAboutModal] = useState(false)

  const handleAboutModal = () => {
    toggleAboutModal(!showAboutModal);
  };

  return (
    <div className="App">
      <div className="App-wrapper">
        <Header handleAboutModal={handleAboutModal} />
        <AboutModal handleAboutModal={handleAboutModal} showAboutModal={showAboutModal} />
        <IntroModal />
        <Map />
      </div>
    </div>
  );
};

export default App;
