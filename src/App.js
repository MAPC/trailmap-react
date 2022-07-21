import React from "react";
import Map from "./components/Map";
import Header from "./components/Header";
import IntroModal from './components/IntroModal';
import './styles/App.scss';

const App = () => {
  return (
    <div className="App">
      <div className="App-wrapper">
        <Header />
        <IntroModal />
        <Map />
      </div>
    </div>
  );
};

export default App;
