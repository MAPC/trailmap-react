import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import FilterIcon from "../assets/filter-icon.svg";
import ShareIcon from "../assets/share-icon.svg";
import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from 'react-router-dom';
import ShareModal from './ShareModal';
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import GeocoderPanel from './GeocoderPanel';
import ControlPanel from "./ControlPanel";
import LayerData from "../data/LayerData";
import BasemapPanel from "./BasemapPanel";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const TRAILMAP_SOURCE = process.env.REACT_APP_TRAIL_MAP_TILE_URL;

const Map = () => {
  const basemaps = LayerData.basemap;

  const [viewport, setViewport] = useState({
    latitude: 42.3772,
    longitude: -71.0244,
    zoom: 8.5,
    transitionDuration: 1000
  });
  const [trailLayers, setTrailLayers] = useState([]);
  const [baseLayer, setBaseLayer] = useState(basemaps[0]);
  const [showControlPanel, toggleControlPanel] = useState(true)
  const [showShareModal, toggleShareModal] = useState(false)

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
    trailLayers.forEach((layer) => {
      const addLayer = LayerData.existing.find(l => l.id === layer);
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

  const handleBaseLayer = (layer) => {
    setBaseLayer(layer);
  }

  const handleTrailLayers = (layer) => {
    trailLayers.includes(layer) ?
      setTrailLayers(current => current.filter(trailLayer => trailLayer !== layer)) :
      setTrailLayers(current => [...current, layer]);
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
          <button className="Map_filter_control"
            onClick={() => toggleControlPanel(!showControlPanel)}
          >
            <img src={FilterIcon} alt="Show Control Panel" />
          </button>
          <button className="Map_share"
            onClick={() => toggleShareModal(!showShareModal)}
          >
            <img src={ShareIcon} alt="Share Map" />
          </button>
          <ControlPanel
            layerData={LayerData.existing}
            trailLayers={trailLayers}
            showPanel={showControlPanel}
            handleTrailLayers={handleTrailLayers} />
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
          <Source
            id="MAPC trail vector tiles"
            type="vector"
            tiles={[TRAILMAP_SOURCE]} >
            {visibleLayers()}
          </Source>
          <BasemapPanel
            basemaps={basemaps}
            handleBaseLayer={handleBaseLayer}
            baseLayer={baseLayer} />
        </ReactMapGL >
      </div>
    </>
  );
};

export default Map;