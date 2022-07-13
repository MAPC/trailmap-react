import React from "react";
import Map from "./components/Map";
import Header from "./components/Header";
import './styles/App.scss';

const App = () => {
  return (
    <div className="App">
      <div className="App-wrapper">
        <Header />
        <Map />
      </div>
    </div>
  );
};

export default App;
