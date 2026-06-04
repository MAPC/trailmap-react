import BasemapIcon from "../../assets/icons/basemap-icon.svg";
import FilterIcon from "../../assets/icons/filter-icon.svg";
import Button from "react-bootstrap/Button";
import CloseButton from "react-bootstrap/CloseButton";
import React, { useState, useRef, useEffect, useContext } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl, Popup } from "react-map-gl";
import bbox from "@turf/bbox";
import LoadingBar from "../LoadingBar";
import TrailListWindow from "../TrailListWindow";
import BasemapPanel from "../BasemapPanel";
import Control from "./Control";
import ControlPanel from "../ControlPanel";
import MAhouseDistrictsButton from '../MAhouseDistrictsButton';
import MASenateDistrictsButton from '../MASenateDistrictsButton';
import MunicipalitiesButton from '../MunicipalitiesButton';
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import GlossaryModal from "../Modals/GlossaryModal";
import Identify from "./Identify";
import CommunityIdentify from "./CommunityIdentify";
import ShareModal from "../Modals/ShareModal";
import { ModalContext } from "../../App";
import { LayerContext } from "../../App";
import EditModal from "../Modals/EditModal";
import massachusettsData from "../../data/massachusetts.json";
// Commuter rail and bike station data will be fetched when needed
import SuccessModal from "../Modals/SuccessModal";
import FailModal from "../Modals/FailModal";
import BufferAnalysisWindow from "../BufferAnalysisWindow";
import TrailLegend from "./TrailLegend";
import * as turf from "@turf/turf";
// Extracted components
import CommunityTrailsProfile from "./CommunityTrailsProfile";
import OriginalTrailsMap from "./OriginalTrailsMap";
import ProjectTrailsProfile from "./ProjectTrailsProfile";
// Extracted constants
import { geojsonTrailLayers } from "./constants/geojsonTrailLayers";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const TRAILMAP_SOURCE = process.env.REACT_APP_TRAIL_MAP_TILE_URL;
const LANDLINE_SOURCE = process.env.REACT_APP_LANDLINE_TILE_URL;
const TRAILMAP_IDENTIFY_SOURCE = process.env.REACT_APP_TRAIL_MAP_IDENTIFY_URL;

const Map = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showShareModal, toggleShareModal } = useContext(ModalContext);
  const {
    trailLayers,
    setTrailLayers,
    proposedLayers,
    baseLayer,
    setBaseLayer,
    showLandlineLayer,
    showMaHouseDistricts,
    showMaSenateDistricts,
    showMunicipalities,
    basemaps,
    existingTrails,
    proposedTrails,
    landlines,
    selectedMunicipality,
    setSelectedMunicipality,
    municipalityTrails,
    setMunicipalityTrails,
    showMunicipalityProfileMap,
    showMunicipalityView,
    showProjectTrailsProfileMap,
    showProjectTrailsView,
    // Layer toggle states from context
    showCommuterRail,
    setShowCommuterRail,
    showStationLabels,
    setShowStationLabels,
    showBlueBikeStations,
    setShowBlueBikeStations,
    showSubwayStations,
    setShowSubwayStations,
  } = useContext(LayerContext);

  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 10,
    transitionDuration: 1000,
  });
  const [showBasemapPanel, toggleBasemapPanel] = useState(false);
  const [showControlPanel, toggleControlPanel] = useState(true);
  // Shared state for modals (EditModal needs identifyInfo)
  const [identifyInfo, setIdentifyInfo] = useState(null);
  const [pointIndex, setPointIndex] = useState(0);



  const mapRef = useRef();

  const [searchParams, _setSearchParams] = useSearchParams();

  useEffect(() => {
    //http://localhost:8080/?baseLayer=mapboxDark&trailLayers=pavedPaths,unimprovedPaths,bikeLane
    const setMapParam = () => {
      const paramsToObject = (entries) => {
        const result = {};
        for (const [key, value] of entries) {
          result[key] = value;
        }
        return result;
      };
      const params = paramsToObject(searchParams.entries());
      if (!!params.baseLayer) {
        const paramBase = basemaps.find((bm) => bm.id === params.baseLayer);
        setBaseLayer(paramBase);
      }
      if (!!params.trailLayers) {
        setTrailLayers(params.trailLayers.split(","));
      }
      if (!!params.zoom && !!params.centroid) {
        let newViewport = viewport;
        newViewport.zoom = params.zoom;
        newViewport.latitude = params.centroid.split(",")[0];
        newViewport.longitude = params.centroid.split(",")[1];
        setViewport(newViewport);
      }
    };
    setMapParam();
  }, []);

  // Auto-switch to light basemap when entering municipality or project trails profile
  useEffect(() => {
    if (showMunicipalityProfileMap || showProjectTrailsProfileMap) {
      const lightBasemap = basemaps.find((bm) => bm.id === 'mapboxLight');
      if (lightBasemap && baseLayer.id !== 'mapboxLight') {
        setBaseLayer(lightBasemap);
      }
    }
  }, [showMunicipalityProfileMap, showProjectTrailsProfileMap, basemaps, baseLayer, setBaseLayer]);

  const generateShareUrl = () => {
    return `${window.location.href.split("?")[0]}?baseLayer=${baseLayer.id}&trailLayers=${trailLayers.join(
      ","
    )}&centroid=${viewport.latitude},${viewport.longitude}&zoom=${viewport.zoom}`;
  };
  return (
    <>
      <ShareModal url={generateShareUrl()} />
      <GlossaryModal />
      <EditModal trailObj={identifyInfo !== null ? identifyInfo[pointIndex] : null} />
      <SuccessModal />
      <FailModal />

      <div className="Map position-relative">
        {showProjectTrailsProfileMap ? (
          <ProjectTrailsProfile
            viewport={viewport}
            setViewport={setViewport}
            baseLayer={baseLayer}
            showBasemapPanel={showBasemapPanel}
            toggleBasemapPanel={toggleBasemapPanel}
            showControlPanel={showControlPanel}
            toggleControlPanel={toggleControlPanel}
            mapRef={mapRef}
          />
        ) : showMunicipalityProfileMap ? (
          <CommunityTrailsProfile
            viewport={viewport}
            setViewport={setViewport}
            baseLayer={baseLayer}
            showBasemapPanel={showBasemapPanel}
            toggleBasemapPanel={toggleBasemapPanel}
            showControlPanel={showControlPanel}
            toggleControlPanel={toggleControlPanel}
            mapRef={mapRef}
              />
            ) : (
          <OriginalTrailsMap
            viewport={viewport}
            setViewport={setViewport}
            baseLayer={baseLayer}
            showBasemapPanel={showBasemapPanel}
            toggleBasemapPanel={toggleBasemapPanel}
            showControlPanel={showControlPanel}
            toggleControlPanel={toggleControlPanel}
            mapRef={mapRef}
            trailLayers={trailLayers}
            proposedLayers={proposedLayers}
            existingTrails={existingTrails}
            proposedTrails={proposedTrails}
            />
          )}
        
        {/* Share Control Button - hidden in community trails profile */}
        {!showMunicipalityProfileMap && (
          <Control
            style={"Map_share d-block position-absolute m-0 p-0"}
            iconClass="fa-solid fa-file-arrow-down"
            alt={"Download map data"}
            clickHandler={() => toggleShareModal(!showShareModal)}
          />
        )}
                  </div>
    </>
  );
};

export default Map;
