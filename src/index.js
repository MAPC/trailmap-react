import { Buffer } from "buffer";
// wkx expects a global Buffer (Node API) when parsing PostGIS EWKB in the browser
window.Buffer = window.Buffer || Buffer;

import "mapbox-gl/dist/mapbox-gl.css";
import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <App />
  </Router>
);