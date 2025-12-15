import React, { createContext, useState, useEffect } from "react";
import "./styles/App.scss";
import Header from "./components/Header";
import IntroModal from "./components/Modals/IntroModal";
import ContributeModal from "./components/Modals/ContributeModal";
import AboutModal from "./components/Modals/AboutModal";
import EditModal from "./components/Modals/EditModal";
import Map from "./components/Map";
import LayerData from "./data/LayerData";
import { useLocation } from "react-router-dom";

export const ModalContext = createContext();
export const LayerContext = createContext();

const App = () => {
  const location = useLocation();
  const basemaps = LayerData.basemap;
  const existingTrails = LayerData.existing;
  const proposedTrails = LayerData.proposed;
  const landlines = LayerData.landline;

  // Don't show intro modal if user navigates directly to communityTrailsProfile
  const [showIntroModal, toggleIntroModal] = useState(
    location.pathname !== '/communityTrailsProfile'
  );

  // Update intro modal visibility when path changes
  useEffect(() => {
    if (location.pathname === '/communityTrailsProfile' && showIntroModal) {
      toggleIntroModal(false);
    }
  }, [location.pathname]);
  const [showAboutModal, toggleAboutModal] = useState(false);
  const [showContributeModal, toggleContributeModal] = useState(false);
  const [showShareModal, toggleShareModal] = useState(false);
  const [showGlossaryModal, toggleGlossaryModal] = useState(false);
  const [showEditModal, toggleEditModal] = useState(false);

  const [showSuccessModal, toggleSuccessModal] = useState(false);
  const [showFailModal, toggleFailModal] = useState(false);

  const [trailLayers, setTrailLayers] = useState([]);
  const [proposedLayers, setProposedLayers] = useState([]);
  const [baseLayer, setBaseLayer] = useState(basemaps[0]);
  const [showLandlineLayer, toggleLandlineLayer] = useState(false);
  const [showLegislativeDistricts, toggleLegislativeDistricts] = useState(false);
  const [showMaHouseDistricts, toggleMaHouseDistricts] = useState(false);
  const [showMaSenateDistricts, toggleMaSenateDistricts] = useState(false);
  const [showMunicipalities, toggleMunicipalities] = useState(false);
  
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [municipalityTrails, setMunicipalityTrails] = useState([]);
  const [showMunicipalityView, setShowMunicipalityView] = useState(false);
  const [showMunicipalityProfileMap, setShowMunicipalityProfileMap] = useState(false);
  
  // Layer toggle states for municipality profile
  const [showCommuterRail, setShowCommuterRail] = useState(false);
  const [showStationLabels, setShowStationLabels] = useState(false);
  const [showBlueBikeStations, setShowBlueBikeStations] = useState(false);
  const [showSubwayStations, setShowSubwayStations] = useState(false);

  return (
    <div className="App">
      <div className="App-wrapper position-relative vw-100 vh-100">
        <ModalContext.Provider
          value={{
            showIntroModal,
            toggleIntroModal,
            showAboutModal,
            toggleAboutModal,
            showContributeModal,
            toggleContributeModal,
            showShareModal,
            toggleShareModal,
            showGlossaryModal,
            toggleGlossaryModal,
            showEditModal,
            toggleEditModal,
            showSuccessModal,
            toggleSuccessModal,
            showFailModal,
            toggleFailModal,
          }}
        >
          <Header />
          <AboutModal />
          <ContributeModal />
          <LayerContext.Provider
            value={{
              trailLayers,
              setTrailLayers,
              proposedLayers,
              setProposedLayers,
              baseLayer,
              setBaseLayer,
              showLandlineLayer,
              toggleLandlineLayer,
              showLegislativeDistricts,
              toggleLegislativeDistricts,
              showMaHouseDistricts,
              toggleMaHouseDistricts,
              showMaSenateDistricts,
              toggleMaSenateDistricts,
              showMunicipalities,
              toggleMunicipalities,
              selectedMunicipality,
              setSelectedMunicipality,
              municipalityTrails,
              setMunicipalityTrails,
              showMunicipalityView,
              setShowMunicipalityView,
              showMunicipalityProfileMap,
              setShowMunicipalityProfileMap,
              // Layer toggle states
              showCommuterRail,
              setShowCommuterRail,
              showStationLabels,
              setShowStationLabels,
              showBlueBikeStations,
              setShowBlueBikeStations,
              showSubwayStations,
              setShowSubwayStations,
              basemaps,
              existingTrails,
              proposedTrails,
              landlines,
            }}
          >
            <IntroModal />
            <Map />
          </LayerContext.Provider>
        </ModalContext.Provider>
      </div>
    </div>
  );
};

export default App;
