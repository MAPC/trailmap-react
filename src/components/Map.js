import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import FilterIcon from "../assets/icons/filter-icon.svg";
import ShareIcon from "../assets/icons/share-icon.svg";
import React, { useState, useRef, useEffect, createContext } from "react";
import { useSearchParams } from 'react-router-dom';
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl } from 'react-map-gl';
import BasemapPanel from "./BasemapPanel";
import ControlPanel from "./ControlPanel";
import GeocoderPanel from './Geocoder/GeocoderPanel';
import LayerData from "../data/LayerData";
import ShareModal from './Modals/ShareModal';
import GlossaryModal from './Modals/GlossaryModal';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const TRAILMAP_SOURCE = process.env.REACT_APP_TRAIL_MAP_TILE_URL;

export const LayerContext = createContext();

const Map = () => {
  const basemaps = LayerData.basemap;

  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 10,
    transitionDuration: 1000
  });
  const [trailLayers, setTrailLayers] = useState([]);
  const [proposedLayers, setProposedLayers] = useState([]);
  const [baseLayer, setBaseLayer] = useState(basemaps[0]);
  const [showControlPanel, toggleControlPanel] = useState(true)
  const [showShareModal, toggleShareModal] = useState(false)
  const [showGlossaryModal, toggleGlossaryModal] = useState(false)

  const mapRef = useRef();

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    //http://localhost:8080/?baseLayer=mapboxDark&trailLayers=pavedPaths,unimprovedPaths,bikeLane
    const setMapParam = () => {
      const paramsToObject = (entries) => {
        const result = {};
        for (const [key, value] of entries) {
          result[key] = value;
        }
        return result;
      }
      const params = paramsToObject(searchParams.entries());
      if (!!params.baseLayer) {
        const paramBase = basemaps.find(bm => bm.id === params.baseLayer);
        setBaseLayer(paramBase);
      }
      if (!!params.trailLayers) {
        setTrailLayers(params.trailLayers.split(','));
      }
      if (!!params.zoom && !!params.centroid) {
        let newViewport = viewport;
        newViewport.zoom = params.zoom;
        newViewport.latitude = params.centroid.split(',')[0];
        newViewport.longitude = params.centroid.split(',')[1];
        setViewport(newViewport);
      }
    };
    setMapParam();
  }, []);

  const visibleLayers = () => {
    const visibleLayers = [];
    const allLayers = [...trailLayers, ...proposedLayers];
    allLayers.forEach((layer) => {
      const layerType = layer.includes("Proposed") ? "proposed" : "existing";
      const addLayer = LayerData[layerType].find(l => l.id === layer);
      visibleLayers.push(
        <Layer
          key={addLayer.id}
          id={addLayer.id}
          type={addLayer.type}
          source="MAPC trail vector tiles"
          source-layer={addLayer['source-layer']}
          paint={addLayer.paint}
          layout={addLayer.layout}>
        </Layer>
      )
    });
    return (visibleLayers);
  }

  const handleGlossaryModal = () => {
    toggleGlossaryModal(!showGlossaryModal);
  };

  const handleShareModal = () => {
    toggleShareModal(!showShareModal)
  };

  const generateShareUrl = () => {
    //http://localhost:8080/?baseLayer=mapboxDark&trailLayers=pavedPaths,unimprovedPaths,bikeLane
    return `${window.location.href.split('?')[0]}?baseLayer=${baseLayer.id}&trailLayers=${trailLayers.join(',')}&centroid=${viewport.latitude},${viewport.longitude}&zoom=${viewport.zoom}`;
  }

  return (
    <>
      <ShareModal
        url={generateShareUrl()}
        handleClose={handleShareModal}
        show={showShareModal}
      />
      <GlossaryModal
        handleClose={handleGlossaryModal}
        show={showGlossaryModal}
      />
      <div className="Map">
        <ReactMapGL
          ref={mapRef}
          {...viewport}
          width="100%"
          height="100%"
          onMove={(event) => setViewport(event.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={baseLayer.url}
          scrollZoom={true}
          transitionDuration="1000"
        >
          <GeocoderPanel
            MAPBOX_TOKEN={MAPBOX_TOKEN}
          />
          <button
            className="Map_filter_control"
            onClick={() => toggleControlPanel(!showControlPanel)}
          >
            <img src={FilterIcon} alt="Show Control Panel" />
          </button>
          <button className="Map_share"
            onClick={() => toggleShareModal(!showShareModal)}
          >
            <img src={ShareIcon} alt="Share Map" />
          </button>
          <LayerContext.Provider
            value={{
              trailLayers, setTrailLayers,
              proposedLayers, setProposedLayers,
              baseLayer, setBaseLayer
            }}>
            <ControlPanel
              layerData={LayerData.existing}
              proposedData={LayerData.proposed}
              showPanel={showControlPanel}
              handleGlossaryModal={handleGlossaryModal}
            />
            <BasemapPanel
              basemaps={basemaps} />
            <Source
              id="MAPC trail vector tiles"
              type="vector"
              tiles={[TRAILMAP_SOURCE]} >
              {visibleLayers()}
            </Source>
          </LayerContext.Provider>
          <ScaleControl
            position="bottom-right"
          />
          <NavigationControl
            className="map_navigation"
            position="bottom-right" />
          <GeolocateControl
            className="map_geolocate"
            positionOptions={{ enableHighAccuracy: true }}
            showUserHeading={false}
            showAccuracyCircle={false}
            showUserLocation={true}
            trackUserLocation={false}
            position="bottom-right"
          />
        </ReactMapGL >
      </div>
    </>
  );
};

export default Map;