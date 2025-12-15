import BasemapIcon from "../../assets/icons/basemap-icon.svg";
import FilterIcon from "../../assets/icons/filter-icon.svg";
import ShareIcon from "../../assets/icons/share-icon.svg";
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
  const [showIdentifyPopup, toggleIdentifyPopup] = useState(false);
  const [identifyInfo, setIdentifyInfo] = useState(null);
  const [identifyPoint, setIdentifyPoint] = useState(null);
  const [pointIndex, setPointIndex] = useState(0);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [hoverFeature, setHoverFeature] = useState(null);
  const [hoverFilterKey, setHoverFilterKey] = useState(null);
  const [hoverFilterValue, setHoverFilterValue] = useState(null);
  const [senateHoverPoint, setSenateHoverPoint] = useState(null);
  const [senateHoverFeature, setSenateHoverFeature] = useState(null);
  const [senateHoverFilterKey, setSenateHoverFilterKey] = useState(null);
  const [senateHoverFilterValue, setSenateHoverFilterValue] = useState(null);
  const [muniHoverPoint, setMuniHoverPoint] = useState(null);
  const [muniHoverFeature, setMuniHoverFeature] = useState(null);
  const [muniHoverFilterKey, setMuniHoverFilterKey] = useState(null);
  const [muniHoverFilterValue, setMuniHoverFilterValue] = useState(null);
  const [showOneLayerNotice, setShowOneLayerNotice] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [muniClickEnabled, setMuniClickEnabled] = useState(false);
  const [isQueryingTrails, setIsQueryingTrails] = useState(false);
  const lastQueriedMunicipality = useRef(null);
  const [selectedTrailFromList, setSelectedTrailFromList] = useState(null);
  const [highlightedTrail, setHighlightedTrail] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [geojsonTrails, setGeojsonTrails] = useState({});
  const [intersectedTrails, setIntersectedTrails] = useState([]);
  const [showTrailListWindow, setShowTrailListWindow] = useState(false);
  const [selectedTrailIndex, setSelectedTrailIndex] = useState(null);
  const [hoveredTrail, setHoveredTrail] = useState(null);
  const [hoveredBlueBikeStation, setHoveredBlueBikeStation] = useState(null);
  const [hoveredCommuterRailStation, setHoveredCommuterRailStation] = useState(null);
  const [hoveredSubwayStation, setHoveredSubwayStation] = useState(null);
  
  // Fetched data states
  const [commuterRailData, setCommuterRailData] = useState(null);
  const [commuterRailStationsData, setCommuterRailStationsData] = useState(null);
  const [blueBikeStationsData, setBlueBikeStationsData] = useState(null);
  const [subwayStationsData, setSubwayStationsData] = useState(null);
  
  // Buffer analysis states
  const [showBufferAnalysis, setShowBufferAnalysis] = useState(false);
  const [isBufferActive, setIsBufferActive] = useState(false);
  const [bufferCenter, setBufferCenter] = useState(null);
  const [bufferRadius, setBufferRadius] = useState(1609); // Default: 1 mile in meters
  const [bufferResults, setBufferResults] = useState(null);
  const [bufferPreviewCenter, setBufferPreviewCenter] = useState(null); // For mouse-following circle

  // GeoJSON trail layer definitions - using local fileso 
  // Colors match LayerData.js for consistency
  const geojsonTrailLayers = [
    { id: 0, name: "Protected Bike Lanes", filename: "existing_protected_bike_lanes.json", color: "#2166AC" },
    { id: 1, name: "Planned Protected Bike Lanes", filename: "planned_protected_bike_lanes.json", color: "#2166AC", dashArray: [2, 2] },
    { id: 2, name: "Bike Lanes", filename: "existing_bike_lanes.json", color: "#92C5DE" },
    { id: 3, name: "Planned Bike Lanes", filename: "proposed_bike_lanes.json", color: "#92C5DE", dashArray: [2, 2] },
    { id: 4, name: "Paved Foot Path", filename: "paved_footway.json", color: "#903366" },
    { id: 5, name: "Planned Paved Foot Path", filename: "proposed_paved_footway.json", color: "#903366", dashArray: [2, 2] },
    { id: 6, name: "Natural Surface Path", filename: "natural_surface_footway.json", color: "#A87196" },
    { id: 7, name: "Planned Natural Surface Path", filename: "proposed_natural_surface_footway.json", color: "#A87196", dashArray: [2, 2] },
    { id: 8, name: "Paved Shared Use", filename: "existing_paved_shared_use_paths.json", color: "#214A2D" },
    { id: 9, name: "Planned Paved Shared Use", filename: "proposed_paved_shared_use_paths.json", color: "#214A2D", dashArray: [2, 2] },
    { id: 10, name: "Planned Unimproved Shared Use", filename: "proposed_unimproved_shared_use_paths.json", color: "#4BAA40", dashArray: [2, 2] },
    { id: 11, name: "Unimproved Shared Use", filename: "existing_unimproved_shared_use_paths.json", color: "#4BAA40" }
  ];

  // Show notice when any one of the exclusive layers turns on
  useEffect(() => {
    if (showMunicipalities || showMaHouseDistricts || showMaSenateDistricts) {
      setShowOneLayerNotice(true);
    }
  }, [showMunicipalities, showMaHouseDistricts, showMaSenateDistricts]);

  // Auto-hide the one-layer notice after 2 seconds when shown
  useEffect(() => {
    if (!showOneLayerNotice) return;
    const timer = setTimeout(() => setShowOneLayerNotice(false), 2000);
    return () => clearTimeout(timer);
  }, [showOneLayerNotice]);

  // Handle zoom transitions and clear hover states after zoom completes
  useEffect(() => {
    if (isZooming) {
      // Set a timer to clear hover states after zoom transition completes
      const timer = setTimeout(() => {
        setHoverFeature(null);
        setHoverPoint(null);
        setHoverFilterKey(null);
        setHoverFilterValue(null);
        setSenateHoverFeature(null);
        setSenateHoverPoint(null);
        setSenateHoverFilterKey(null);
        setSenateHoverFilterValue(null);
        setMuniHoverFeature(null);
        setMuniHoverPoint(null);
        setMuniHoverFilterKey(null);
        setMuniHoverFilterValue(null);
        setIsZooming(false);
      }, 1100); // Slightly longer than transitionDuration (1000ms)
      
      return () => clearTimeout(timer);
    }
  }, [isZooming]);

  // Clear hover states when identify popup closes to fix hover detection
  useEffect(() => {
    if (!showIdentifyPopup) {
      setHoverFeature(null);
      setHoverPoint(null);
      setHoverFilterKey(null);
      setHoverFilterValue(null);
      setSenateHoverFeature(null);
      setSenateHoverPoint(null);
      setSenateHoverFilterKey(null);
      setSenateHoverFilterValue(null);
      setMuniHoverFeature(null);
      setMuniHoverPoint(null);
      setMuniHoverFilterKey(null);
      setMuniHoverFilterValue(null);
    }
  }, [showIdentifyPopup]);

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

  // Auto-switch to light basemap when entering municipality profile
  useEffect(() => {
    if (showMunicipalityProfileMap) {
      const lightBasemap = basemaps.find((bm) => bm.id === 'mapboxLight');
      if (lightBasemap && baseLayer.id !== 'mapboxLight') {
        setBaseLayer(lightBasemap);
      }
    }
  }, [showMunicipalityProfileMap, basemaps, baseLayer, setBaseLayer]);

  // Ensure Legislative Districts and Municipalities layers persist across basemap changes
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Force re-render of legislative districts layers when basemap changes
      if (showMaHouseDistricts) {
        if (map.getLayer('ma-house-districts-fill')) {
          map.removeLayer('ma-house-districts-fill');
        }
        if (map.getLayer('ma-house-districts-outline')) {
          map.removeLayer('ma-house-districts-outline');
        }
        if (map.getLayer('ma-house-districts-labels')) {
          map.removeLayer('ma-house-districts-labels');
        }
      }

      // Force re-render of senate districts layers when basemap changes
      if (showMaSenateDistricts) {
        if (map.getLayer('ma-senate-districts-fill')) {
          map.removeLayer('ma-senate-districts-fill');
        }
        if (map.getLayer('ma-senate-districts-hover')) {
          map.removeLayer('ma-senate-districts-hover');
        }
        if (map.getLayer('ma-senate-districts-lines')) {
          map.removeLayer('ma-senate-districts-lines');
        }
      }

      // Force re-render of municipalities layers when basemap changes
      if (showMunicipalities) {
        if (map.getLayer('municipalities-fill')) {
          map.removeLayer('municipalities-fill');
        }
        if (map.getLayer('municipalities-hover')) {
          map.removeLayer('municipalities-hover');
        }
        if (map.getLayer('municipalities-labels')) {
          map.removeLayer('municipalities-labels');
        }
      }

      // Force re-render of municipality profile layers when basemap changes
      if (showMunicipalityProfileMap) {
        if (map.getLayer('municipality-profile-base')) {
          map.removeLayer('municipality-profile-base');
        }
        if (map.getLayer('municipality-profile-selected')) {
          map.removeLayer('municipality-profile-selected');
        }
        if (map.getLayer('municipality-profile-outline')) {
          map.removeLayer('municipality-profile-outline');
        }
        if (map.getLayer('municipality-profile-selected-outline')) {
          map.removeLayer('municipality-profile-selected-outline');
        }
      }
    }
  }, [baseLayer, showMaHouseDistricts, showMaSenateDistricts, showMunicipalities, showMunicipalityProfileMap, selectedMunicipality]);

  const visibleLayers = () => {
    const visibleLayers = [];
    
    // For municipality profile, use GeoJSON trails
    if (showMunicipalityProfileMap && intersectedTrails.length > 0) {
      // Group trails by layer for efficient rendering
      const trailsByLayer = {};
      intersectedTrails.forEach(trail => {
        if (!trailsByLayer[trail.layerId]) {
          trailsByLayer[trail.layerId] = [];
        }
        trailsByLayer[trail.layerId].push(trail);
      });

      // Create a GeoJSON source for each layer
      Object.keys(trailsByLayer).forEach(layerId => {
        const layerTrails = trailsByLayer[layerId];
        const layerInfo = geojsonTrailLayers.find(l => l.id === parseInt(layerId));
        
        if (layerInfo) {
          // Create GeoJSON feature collection
          const geojsonData = {
            type: "FeatureCollection",
            features: layerTrails.map(trail => trail.feature)
          };

          // Build paint properties for base layer
          const paintProps = {
            "line-color": layerInfo.color,
            "line-width": 3,
            "line-opacity": 0.8
          };

          // Build paint properties for hover layer (thicker)
          const hoverPaintProps = {
            "line-color": layerInfo.color,
            "line-width": 6,
            "line-opacity": 1
          };

          // Build layout properties (for dashed lines)
          const layoutProps = {};
          if (layerInfo.dashArray) {
            paintProps["line-dasharray"] = layerInfo.dashArray;
            hoverPaintProps["line-dasharray"] = layerInfo.dashArray;
          }

          visibleLayers.push(
            <Source key={`geojson-source-${layerId}`} id={`geojson-source-${layerId}`} type="geojson" data={geojsonData}>
              {/* Base layer */}
              <Layer
                id={`geojson-trail-${layerId}`}
                type="line"
                paint={paintProps}
                layout={layoutProps}
              />
              {/* Hover layer - only shows when hovering */}
              <Layer
                id={`geojson-trail-hover-${layerId}`}
                type="line"
                paint={hoverPaintProps}
                layout={layoutProps}
                filter={
                  hoveredTrail && hoveredTrail.layerId === parseInt(layerId)
                    ? ["==", ["get", "objectid"], hoveredTrail.attributes?.objectid || hoveredTrail.attributes?.OBJECTID || -1]
                    : ["==", ["get", "objectid"], -1]
                }
              />
            </Source>
          );
        }
      });

      // Add highlight layer for selected trail from list
      if (highlightedTrail && highlightedTrail.feature) {
        const highlightGeojson = {
          type: "FeatureCollection",
          features: [highlightedTrail.feature]
        };

        // Use the trail's own color for highlighting
        const highlightPaint = {
          "line-color": highlightedTrail.color || "#FF6B00",
          "line-width": 7,
          "line-opacity": 1
        };

        // Add dash array if the trail has one
        const layerInfo = geojsonTrailLayers.find(l => l.id === highlightedTrail.layerId);
        if (layerInfo && layerInfo.dashArray) {
          highlightPaint["line-dasharray"] = layerInfo.dashArray;
        }

        visibleLayers.push(
          <Source key="highlighted-trail-source" id="highlighted-trail-source" type="geojson" data={highlightGeojson}>
            <Layer
              id="highlighted-trail"
              type="line"
              paint={highlightPaint}
            />
          </Source>
        );
      }
    } else {
      // For regular trail filters, use vector tiles
      const allLayers = [...trailLayers, ...proposedLayers];
      allLayers.forEach((layer) => {
        const layerSet = layer.includes("Proposed") ? proposedTrails : existingTrails;
        const addLayer = layerSet.find((l) => l.id === layer);
        visibleLayers.push(
          <Layer
            key={addLayer.id}
            esri_id={addLayer["esri-id"]}
            id={addLayer.id}
            type={addLayer.type}
            source="MAPC trail vector tiles"
            source-layer={addLayer["source-layer"]}
            paint={addLayer.paint}
            layout={addLayer.layout}
          ></Layer>
        );
      });
    }

    return visibleLayers;
  };
  const landlineLayers = () => {
    const visibleLandlineLayers = [];
    if (showLandlineLayer) {
      landlines.reverse().forEach((layer) => {
        visibleLandlineLayers.push(
          <Layer
            key={layer.id}
            id={layer.id}
            type={layer.type}
            filter={layer.filter}
            source="MAPC landline vector tiles"
            source-layer={layer["source-layer"]}
            paint={layer.paint}
            layout={layer.layout}
          ></Layer>
        );
      });
    }
    return visibleLandlineLayers;
  };

  const maHouseDistrictsLayers = () => {
    const visibleMaHouseDistrictsLayers = [];
    if (showMaHouseDistricts) {
      visibleMaHouseDistrictsLayers.push(
        <Layer
          key="ma-house-districts-fill"
          id="ma-house-districts-fill"
          type="fill"
          source="ma-house-districts"
          paint={{
            "fill-color": "transparent",
            "fill-outline-color": "transparent"
          }}
        />
      );
      visibleMaHouseDistrictsLayers.push(
        <Layer
          key="ma-house-districts-hover"
          id="ma-house-districts-hover"
          type="fill"
          source="ma-house-districts"
          paint={{
            "fill-color": "rgba(255, 166, 0, 0.25)",
            "fill-outline-color": "black"
          }}
          filter={
            hoverFilterKey && hoverFilterValue !== null
              ? ["==", ["get", hoverFilterKey], hoverFilterValue]
              : ["==", ["get", "__none__"], "__no_match__"]
          }
        />
      );
      visibleMaHouseDistrictsLayers.push(
        <Layer
          key="ma-house-districts-lines"
          id="ma-house-districts-lines"
          type="line"
          source="ma-house-districts-lines"
          paint={{
            "line-color": "black",
            "line-width": 1.05
          }}
        />
      );
    }
    return visibleMaHouseDistrictsLayers;
  };

  const maSenateDistrictsLayers = () => {
    const visibleMaSenateDistrictsLayers = [];
    if (showMaSenateDistricts) {
      visibleMaSenateDistrictsLayers.push(
        <Layer
          key="ma-senate-districts-fill"
          id="ma-senate-districts-fill"
          type="fill"
          source="ma-senate-districts"
          paint={{
            "fill-color": "transparent",
            "fill-outline-color": "black"
          }}
        />
      );
      visibleMaSenateDistrictsLayers.push(
        <Layer
          key="ma-senate-districts-hover"
          id="ma-senate-districts-hover"
          type="fill"
          source="ma-senate-districts"
          paint={{
            "fill-color": "rgba(255, 166, 0, 0.25)",
            "fill-outline-color": "black"
          }}
          filter={
            senateHoverFilterKey && senateHoverFilterValue !== null
              ? ["==", ["get", senateHoverFilterKey], senateHoverFilterValue]
              : ["==", ["get", "__none__"], "__no_match__"]
          }
        />
      );
      visibleMaSenateDistrictsLayers.push(
        <Layer
          key="ma-senate-districts-lines"
          id="ma-senate-districts-lines"
          type="line"
          source="ma-senate-districts-lines"
          paint={{
            "line-color": "black",
            "line-width": 1.05
          }}
        />
      );
    }
    return visibleMaSenateDistrictsLayers;
  };

  const municipalitiesLayers = () => {
    const visibleMunicipalitiesLayers = [];
    if (showMunicipalities) {
      visibleMunicipalitiesLayers.push(
        <Layer
          key="municipalities-fill"
          id="municipalities-fill"
          type="fill"
          source="municipalities"
          paint={{
            "fill-color": "transparent",
            "fill-outline-color": "black"
          }}
        />
      );
      
      visibleMunicipalitiesLayers.push(
        <Layer
          key="municipalities-hover"
          id="municipalities-hover"
          type="fill"
          source="municipalities"
          paint={{
            "fill-color": "rgba(255, 166, 0, 0.25)",
            "fill-outline-color": "black"
          }}
          filter={
            muniHoverFilterKey && muniHoverFilterValue !== null
              ? ["==", ["get", muniHoverFilterKey], muniHoverFilterValue]
              : ["==", ["get", "__none__"], "__no_match__"]
          }
        />
      );
    }
    return visibleMunicipalitiesLayers;
  };

  // Separate municipality profile map layers
  const municipalityProfileLayers = () => {
    const profileLayers = [];
    if (showMunicipalityProfileMap) {
      // Base layer - all unselected municipalities with light gray fill
      profileLayers.push(
        <Layer
          key="municipality-profile-base"
          id="municipality-profile-base"
          type="fill"
          source="municipalities"
          paint={{
            "fill-color": "rgba(200, 200, 200, 0.15)",
            "fill-outline-color": "transparent"
          }}
        />
      );

      // Dim unselected municipalities with light grey semi-transparent fill
      if (selectedMunicipality && selectedMunicipality.name) {
        profileLayers.push(
          <Layer
            key="municipality-profile-unselected"
            id="municipality-profile-unselected"
            type="fill"
            source="municipalities"
            paint={{
              "fill-color": "#CCCCCC",
              "fill-opacity": 0.4
            }}
            filter={["!=", ["downcase", ["get", "town"]], selectedMunicipality.name.toLowerCase()]}
          />
        );
      }

      // Outline for all municipalities - gray
      profileLayers.push(
        <Layer
          key="municipality-profile-outline"
          id="municipality-profile-outline"
          type="line"
          source="municipalities"
          paint={{
            "line-color": "#666666",
            "line-width": 1
          }}
        />
      );

      // Selected municipality outline - darker and slightly thicker for clear boundary
      if (selectedMunicipality && selectedMunicipality.name) {
        profileLayers.push(
          <Layer
            key="municipality-profile-selected-outline"
            id="municipality-profile-selected-outline"
            type="line"
            source="municipalities"
            paint={{
              "line-color": "#333333",
              "line-width": 2
            }}
            filter={["==", ["downcase", ["get", "town"]], selectedMunicipality.name.toLowerCase()]}
          />
        );
      }

    }
    return profileLayers;
  };

  const commuterRailLayers = () => {
    if (!showCommuterRail || !showMunicipalityProfileMap || !commuterRailData) {
      return null;
    }

    return (
      <>
        {/* Commuter Rail Lines */}
        <Source key="commuter-rail-source" id="commuter-rail-source" type="geojson" data={commuterRailData}>
          {commuterRailData.features.map((feature) => {
            const routeColor = feature.properties?.route_color 
              ? `#${feature.properties.route_color}` 
              : "#808080";
            
            return (
              <Layer
                key={`commuter-rail-${feature.id}`}
                id={`commuter-rail-${feature.id}`}
                type="line"
                paint={{
                  "line-color": routeColor,
                  "line-width": 1,
                  "line-opacity": 0.8
                }}
                filter={["==", ["get", "shape_id"], feature.properties.shape_id]}
              />
            );
          })}
        </Source>
        
        {/* Commuter Rail Stations */}
        {commuterRailStationsData && (
          <Source key="commuter-rail-stations-source" id="commuter-rail-stations-source" type="geojson" data={commuterRailStationsData}>
          {/* Station outer circle (border) */}
          <Layer
            key="commuter-rail-stations-border"
            id="commuter-rail-stations-border"
            type="circle"
            paint={{
              "circle-radius": 4,
              "circle-color": "#FFFFFF",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#333333"
            }}
          />
          
          {/* Station inner circle (fill) */}
          <Layer
            key="commuter-rail-stations"
            id="commuter-rail-stations"
            type="circle"
            paint={{
              "circle-radius": 3,
              "circle-color": "#FF6B35",
              "circle-opacity": 0.9
            }}
          />
          
          {/* Station labels - only show when enabled */}
          {showStationLabels && (
            <Layer
              key="commuter-rail-stations-labels"
              id="commuter-rail-stations-labels"
              type="symbol"
              layout={{
                "text-field": ["get", "station"],
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-size": 11,
                "text-offset": [0, 1.5],
                "text-anchor": "top"
              }}
              paint={{
                "text-color": "#333333",
                "text-halo-color": "#FFFFFF",
                "text-halo-width": 1.5
              }}
            />
          )}
          
          {/* Commuter Rail Station hover border - larger circle */}
          <Layer
            key="commuter-rail-stations-hover-border"
            id="commuter-rail-stations-hover-border"
            type="circle"
            paint={{
              "circle-radius": 6,
              "circle-color": "#FFFFFF",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FF6B35"
            }}
            filter={
              hoveredCommuterRailStation
                ? ["==", ["get", "station"], hoveredCommuterRailStation.properties?.station || ""]
                : ["==", ["get", "station"], ""]
            }
          />
          
          {/* Commuter Rail Station hover inner - larger circle */}
          <Layer
            key="commuter-rail-stations-hover"
            id="commuter-rail-stations-hover"
            type="circle"
            paint={{
              "circle-radius": 5,
              "circle-color": "#FF6B35",
              "circle-opacity": 1
            }}
            filter={
              hoveredCommuterRailStation
                ? ["==", ["get", "station"], hoveredCommuterRailStation.properties?.station || ""]
                : ["==", ["get", "station"], ""]
            }
          />
          </Source>
        )}
      </>
    );
  };

  const subwayStationsLayers = () => {
    if (!showSubwayStations || !showMunicipalityProfileMap || !subwayStationsData) {
      return null;
    }

    // MBTA official line colors
    const lineColors = {
      'RED': '#DA020E',
      'ORANGE': '#ED8B00', 
      'GREEN': '#00843D',
      'BLUE': '#003DA5'
    };

    return (
      <>
        {/* Subway Lines */}
        <Source key="subway-lines-source" id="subway-lines-source" type="geojson" data={subwayStationsData.lines}>
          {/* Subway Line background - thinner line */}
          <Layer
            key="subway-lines-background"
            id="subway-lines-background"
            type="line"
            paint={{
              "line-color": "#FFFFFF",
              "line-width": 3,
              "line-opacity": 0.8
            }}
          />
          
          {/* Subway Line foreground - colored line */}
          <Layer
            key="subway-lines"
            id="subway-lines"
            type="line"
            paint={{
              "line-color": [
                "match",
                ["get", "LINE"],
                "RED", lineColors.RED,
                "ORANGE", lineColors.ORANGE,
                "GREEN", lineColors.GREEN,
                "BLUE", lineColors.BLUE,
                "#666666" // default color
              ],
              "line-width": 2,
              "line-opacity": 0.9
            }}
          />
        </Source>

        {/* Subway Stations */}
        <Source key="subway-stations-source" id="subway-stations-source" type="geojson" data={subwayStationsData.stations}>
          {/* Subway Station border circle */}
          <Layer
            key="subway-stations-border"
            id="subway-stations-border"
            type="circle"
            paint={{
              "circle-radius": 4,
              "circle-color": "#FFFFFF",
              "circle-stroke-width": 1,
              "circle-stroke-color": "#FFFFFF"
            }}
          />
          
          {/* Subway Station inner circle with line color */}
          <Layer
            key="subway-stations"
            id="subway-stations"
            type="circle"
            interactive={true}
            paint={{
              "circle-radius": 3,
              "circle-color": [
                "match",
                ["get", "LINE"],
                "RED", lineColors.RED,
                "ORANGE", lineColors.ORANGE,
                "GREEN", lineColors.GREEN,
                "BLUE", lineColors.BLUE,
                "#666666" // default color
              ],
              "circle-opacity": 0.9
            }}
          />
          
          {/* Subway Station hover border - larger circle */}
          <Layer
            key="subway-stations-hover-border"
            id="subway-stations-hover-border"
            type="circle"
            paint={{
              "circle-radius": 6,
              "circle-color": "#FFFFFF",
              "circle-stroke-width": 2,
              "circle-stroke-color": [
                "match",
                ["get", "LINE"],
                "RED", lineColors.RED,
                "ORANGE", lineColors.ORANGE,
                "GREEN", lineColors.GREEN,
                "BLUE", lineColors.BLUE,
                "#666666" // default color
              ]
            }}
            filter={
              hoveredSubwayStation
                ? ["==", ["get", "STATION"], hoveredSubwayStation.properties?.STATION || ""]
                : ["==", ["get", "STATION"], ""]
            }
          />
          
          {/* Subway Station hover inner - larger circle */}
          <Layer
            key="subway-stations-hover"
            id="subway-stations-hover"
            type="circle"
            paint={{
              "circle-radius": 5,
              "circle-color": [
                "match",
                ["get", "LINE"],
                "RED", lineColors.RED,
                "ORANGE", lineColors.ORANGE,
                "GREEN", lineColors.GREEN,
                "BLUE", lineColors.BLUE,
                "#666666" // default color
              ],
              "circle-opacity": 0.9
            }}
            filter={
              hoveredSubwayStation
                ? ["==", ["get", "STATION"], hoveredSubwayStation.properties?.STATION || ""]
                : ["==", ["get", "STATION"], ""]
            }
          />
        </Source>
      </>
    );
  };

  const blueBikeStationsLayers = () => {
  
    if (!showBlueBikeStations || !showMunicipalityProfileMap || !blueBikeStationsData) {
      return null;
    }
    return (
      <Source key="blue-bike-stations-source" id="blue-bike-stations-source" type="geojson" data={blueBikeStationsData}>
        {/* Blue Bike Station border circle */}
        <Layer
          key="blue-bike-stations-border"
          id="blue-bike-stations-border"
          type="circle"
          paint={{
            "circle-radius": 4,
            "circle-color": "#FFFFFF",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#FFFFFF"
          }}
        />
        
        {/* Blue Bike Station inner circle */}
        <Layer
          key="blue-bike-stations"
          id="blue-bike-stations"
          type="circle"
          interactive={true}
          paint={{
            "circle-radius": 3,
            "circle-color": "#87CEEB",
            "circle-opacity": 0.9
          }}
        />
        
        {/* Blue Bike Station hover border - larger circle */}
        <Layer
          key="blue-bike-stations-hover-border"
          id="blue-bike-stations-hover-border"
          type="circle"
          paint={{
            "circle-radius": 6,
            "circle-color": "#FFFFFF",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#87CEEB"
          }}
          filter={
            hoveredBlueBikeStation
              ? ["==", ["get", "Name"], hoveredBlueBikeStation.properties?.Name || ""]
              : ["==", ["get", "Name"], ""]
          }
        />
        
        {/* Blue Bike Station hover inner - larger circle */}
        <Layer
          key="blue-bike-stations-hover"
          id="blue-bike-stations-hover"
          type="circle"
          paint={{
            "circle-radius": 5,
            "circle-color": "#87CEEB",
            "circle-opacity": 1
          }}
          filter={
            hoveredBlueBikeStation
              ? ["==", ["get", "Name"], hoveredBlueBikeStation.properties?.Name || ""]
              : ["==", ["get", "Name"], ""]
          }
        />
      </Source>
    );
  };

  // Calculate features within buffer
  const calculateBufferAnalysis = (center, radius) => {
    if (!center || !radius) return null;

    const centerPoint = turf.point([center.lng, center.lat]);
    const bufferCircle = turf.circle(centerPoint, radius / 1000, { units: 'kilometers' });

    const results = {
      trails: [],
      stations: [],
      bikeStations: [],
      subwayStations: []
    };

    // Check trails
    if (intersectedTrails && intersectedTrails.length > 0) {
      intersectedTrails.forEach((trail) => {
        if (trail.geometry) {
          const trailFeature = {
            type: 'Feature',
            geometry: trail.geometry,
            properties: trail.attributes
          };

          // Check if trail intersects with buffer
          const intersects = turf.booleanIntersects(bufferCircle, trailFeature);
          
          if (intersects) {
            // Calculate distance from center to trail
            let distance = 0;
            
            // Handle MultiLineString by converting to LineString or calculating min distance
            if (trail.geometry.type === 'MultiLineString') {
              // For MultiLineString, find the closest segment
              let minDistance = Infinity;
              trail.geometry.coordinates.forEach((lineCoords) => {
                const lineString = turf.lineString(lineCoords);
                const d = turf.pointToLineDistance(centerPoint, lineString, { units: 'meters' });
                if (d < minDistance) {
                  minDistance = d;
                }
              });
              distance = minDistance;
            } else {
              // For LineString, calculate directly
              distance = turf.pointToLineDistance(centerPoint, trailFeature, { units: 'meters' });
            }
            
            // Get trail length
            const lengthInFeet = trail.attributes?.length_ft || 
                                 trail.attributes?.['Facility Length in Feet'] || 
                                 trail.attributes?.Shape_Length || 
                                 0;
            
            results.trails.push({
              name: trail.attributes?.Name || trail.attributes?.name || 'Unnamed Trail',
              type: trail.layerName || 'Unknown',
              distance: distance,
              length: Number(lengthInFeet) * 0.3048, // Convert feet to meters
              color: trail.color
            });
          }
        }
      });

      // Sort trails by distance
      results.trails.sort((a, b) => a.distance - b.distance);
    }

    // Check commuter rail stations
    if (commuterRailStationsData && commuterRailStationsData.features) {
      commuterRailStationsData.features.forEach((station) => {
        const stationPoint = turf.point(station.geometry.coordinates);
        const distance = turf.distance(centerPoint, stationPoint, { units: 'meters' });

        if (distance <= radius) {
          results.stations.push({
            name: station.properties?.station || 'Unknown Station',
            line: station.properties?.line_brnch || 'Unknown Line',
            distance: distance
          });
        }
      });

      // Sort stations by distance
      results.stations.sort((a, b) => a.distance - b.distance);
    }

    // Check Blue Bike stations
    if (blueBikeStationsData && blueBikeStationsData.features) {
      blueBikeStationsData.features.forEach((station) => {
        const stationPoint = turf.point(station.geometry.coordinates);
        const distance = turf.distance(centerPoint, stationPoint, { units: 'meters' });

        if (distance <= radius) {
          results.bikeStations.push({
            name: station.properties?.Name || 'Unknown Station',
            district: station.properties?.District || 'Unknown District',
            totalDocks: station.properties?.Total_docks || 0,
            distance: distance
          });
        }
      });

      // Sort bike stations by distance
      results.bikeStations.sort((a, b) => a.distance - b.distance);
    }

    // Check Subway stations
    if (subwayStationsData && subwayStationsData.stations && subwayStationsData.stations.features) {
      subwayStationsData.stations.features.forEach((station) => {
        const stationPoint = turf.point(station.geometry.coordinates);
        const distance = turf.distance(centerPoint, stationPoint, { units: 'meters' });

        if (distance <= radius) {
          results.subwayStations.push({
            name: station.properties?.STATION || 'Unknown Station',
            line: station.properties?.LINE || 'Unknown Line',
            distance: distance
          });
        }
      });

      // Sort subway stations by distance
      results.subwayStations.sort((a, b) => a.distance - b.distance);
    }

    return results;
  };

  // Render buffer circle on map
  const renderBufferCircle = () => {
    if (!bufferCenter || !bufferRadius) return null;

    const centerPoint = turf.point([bufferCenter.lng, bufferCenter.lat]);
    const bufferCircle = turf.circle(centerPoint, bufferRadius / 1000, { 
      units: 'kilometers',
      steps: 64 
    });

    return (
      <Source key="buffer-circle-source" id="buffer-circle-source" type="geojson" data={bufferCircle}>
        {/* Buffer fill */}
        <Layer
          key="buffer-fill"
          id="buffer-fill"
          type="fill"
          paint={{
            "fill-color": "#0080ff",
            "fill-opacity": 0.15
          }}
        />
        {/* Buffer outline */}
        <Layer
          key="buffer-outline"
          id="buffer-outline"
          type="line"
          paint={{
            "line-color": "#0080ff",
            "line-width": 2,
            "line-dasharray": [2, 2]
          }}
        />
      </Source>
    );
  };

  // Render buffer preview circle that follows mouse
  const renderBufferPreview = () => {
    if (!bufferPreviewCenter || !isBufferActive) {
      return null;
    }

    const centerPoint = turf.point([bufferPreviewCenter.lng, bufferPreviewCenter.lat]);
    const previewCircle = turf.circle(centerPoint, bufferRadius / 1000, { 
      units: 'kilometers',
      steps: 64 
    });

    return (
      <Source key="buffer-preview-source" id="buffer-preview-source" type="geojson" data={previewCircle}>
        {/* Preview fill */}
        <Layer
          key="buffer-preview-fill"
          id="buffer-preview-fill"
          type="fill"
          paint={{
            "fill-color": "#ff8000",
            "fill-opacity": 0.1
          }}
        />
        {/* Preview outline */}
        <Layer
          key="buffer-preview-outline"
          id="buffer-preview-outline"
          type="line"
          paint={{
            "line-color": "#ff8000",
            "line-width": 2,
            "line-dasharray": [1, 1]
          }}
        />
      </Source>
    );
  };

  // Render buffer center marker
  const renderBufferCenter = () => {
    if (!bufferCenter) return null;

    const centerGeoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [bufferCenter.lng, bufferCenter.lat]
        }
      }]
    };

    return (
      <Source key="buffer-center-source" id="buffer-center-source" type="geojson" data={centerGeoJSON}>
        <Layer
          key="buffer-center"
          id="buffer-center"
          type="circle"
          paint={{
            "circle-radius": 8,
            "circle-color": "#0080ff",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
          }}
        />
      </Source>
    );
  };

  // Handle trail click from Trail List Window
  const handleTrailListClick = (trail, index) => {
    setSelectedTrailIndex(index);
    setHighlightedTrail(trail);
    
    // Calculate center point for popup first
    let popupPoint = null;
    if (trail.geometry && trail.geometry.coordinates && trail.geometry.coordinates.length > 0) {
      const coords = trail.geometry.coordinates;
      // Handle MultiLineString vs LineString
      const coordsArray = trail.geometry.type === 'MultiLineString' 
        ? coords[0] 
        : coords;
      
      if (coordsArray && coordsArray.length > 0) {
        const midPoint = coordsArray[Math.floor(coordsArray.length / 2)];
        if (midPoint && midPoint.length >= 2 && !isNaN(midPoint[0]) && !isNaN(midPoint[1])) {
          popupPoint = { lng: midPoint[0], lat: midPoint[1] };
        }
      }
    }
    
    // Only show popup if we have a valid point
    if (popupPoint) {
      // Show identify popup with trail data
      const mockResult = {
        attributes: trail.attributes,
        layerName: trail.layerName
      };
      
      // Force popup refresh by toggling off then on
      toggleIdentifyPopup(false);
      
      setTimeout(() => {
        setIdentifyPoint(popupPoint);
        setIdentifyInfo([mockResult]);
        setPointIndex(0);
        toggleIdentifyPopup(true);
      }, 10);
    }
    
    // Zoom to trail if it has geometry
    if (trail.geometry && trail.geometry.coordinates) {
      try {
        const trailBbox = bbox(trail.geometry);
        const map = mapRef.current.getMap();
        map.fitBounds(
          [[trailBbox[0], trailBbox[1]], [trailBbox[2], trailBbox[3]]],
          { padding: 100, duration: 1000 }
        );
      } catch (error) {
        console.error("Error zooming to trail:", error);
      }
    }
  };

  const generateShareUrl = () => {
    //sample URL
    //http://localhost:8080/?baseLayer=mapboxDark&trailLayers=pavedPaths,unimprovedPaths,bikeLane
    return `${window.location.href.split("?")[0]}?baseLayer=${baseLayer.id}&trailLayers=${trailLayers.join(
      ","
    )}&centroid=${viewport.latitude},${viewport.longitude}&zoom=${viewport.zoom}`;
  };

  // Function to zoom to municipality
  const handleZoomToMunicipality = (municipality) => {
    if (municipality && municipality.geometry) {
      try {
        const [minLng, minLat, maxLng, maxLat] = bbox(municipality.geometry);
        const map = mapRef.current.getMap();
        map.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          {
            padding: 50,
            duration: 1000
          }
        );
        
        // Enable municipalities layer if not already enabled
        if (!showMunicipalities) {
          const { toggleMunicipalities } = LayerContext._currentValue || {};
          if (toggleMunicipalities) {
            toggleMunicipalities(true);
          }
        }
      } catch (error) {
        console.error("Error zooming to municipality:", error);
      }
    }
  };

  // Function to load GeoJSON trail data and find intersections
  const queryMunicipalityTrails = async (municipality) => {
    if (!municipality || !municipality.geometry) {
      setMunicipalityTrails([]);
      setIntersectedTrails([]);
      lastQueriedMunicipality.current = null;
      return;
    }

    // Prevent duplicate queries
    if (isQueryingTrails) {
      console.log("Query already in progress, skipping...");
      return;
    }

    // Check if we already queried this municipality
    if (lastQueriedMunicipality.current === municipality.name) {
      console.log("Already queried this municipality, skipping...");
      return;
    }

    setIsQueryingTrails(true);
    setLoadingProgress(0);
    setLoadingMessage("Loading trail data...");
    console.log("Starting GeoJSON query for municipality:", municipality.name);
    console.log("Municipality town_id:", municipality.properties?.town_id);

    try {
      const allTrailResults = [];
      const totalLayers = geojsonTrailLayers.length;
      const municipalityId = municipality.properties?.town_id;
      
      if (!municipalityId) {
        console.error("Municipality does not have a town_id");
        setMunicipalityTrails([]);
        setIsQueryingTrails(false);
        return;
      }
      
      // Load each GeoJSON layer from local files
      for (let i = 0; i < geojsonTrailLayers.length; i++) {
        const layer = geojsonTrailLayers[i];
        setLoadingMessage(`Loading ${layer.name}...`);
        setLoadingProgress((i / totalLayers) * 50); // First 50% for loading

        try {
          // Fetch the local GeoJSON file
          const response = await fetch(`./src/data/${layer.filename}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${layer.filename}: ${response.status}`);
          }
          const geojsonData = await response.json();
          if (geojsonData && geojsonData.features) {
            setLoadingMessage(`Processing ${layer.name}...`);
            setLoadingProgress(50 + (i / totalLayers) * 30); // Next 30% for processing

            // Find trails that match the municipality ID (much faster than geometric intersection)
            const intersectingFeatures = geojsonData.features.filter(feature => {
              return feature.properties?.muni_id === municipalityId;
            });

            // Add layer information to each intersecting feature
            intersectingFeatures.forEach(feature => {
              allTrailResults.push({
                layerId: layer.id,
                layerName: layer.name,
                attributes: feature.properties,
                geometry: feature.geometry,
                color: layer.color,
                feature: feature
              });
            });
          }
        } catch (error) {
          console.error(`Error loading layer ${layer.name}:`, error);
        }
      }

      setLoadingMessage("Finalizing results...");
      setLoadingProgress(90);

      console.log(`Total trails found: ${allTrailResults.length}`);
      console.log('Trails by layer ID:', allTrailResults.reduce((acc, trail) => {
        acc[trail.layerId] = (acc[trail.layerId] || 0) + 1;
        return acc;
      }, {}));

      setLoadingProgress(100);
      
      // Use all results without deduplication
      setMunicipalityTrails(allTrailResults);
      setIntersectedTrails(allTrailResults);
      lastQueriedMunicipality.current = municipality.name;

    } catch (error) {
      console.error("Error querying municipality trails:", error);
      setMunicipalityTrails([]);
      setIntersectedTrails([]);
    } finally {
      setIsQueryingTrails(false);
      setLoadingProgress(0);
      setLoadingMessage("");
    }
  };

  // Query trails when municipality is selected (only on municipality change, not on trail layer changes)
  useEffect(() => {
    if (selectedMunicipality) {
      queryMunicipalityTrails(selectedMunicipality);
      // Trail list window will be closed by default, user can open it manually
    } else {
      setMunicipalityTrails([]);
      setShowTrailListWindow(false);
      lastQueriedMunicipality.current = null;
    }
  }, [selectedMunicipality]); // Removed trailLayers and proposedLayers from dependencies to prevent re-querying

  // Listen for custom event to open trail list
  useEffect(() => {
    const handleOpenTrailList = () => {
      setShowTrailListWindow(true);
    };
    
    const handleToggleCommuterRail = (event) => {
      setShowCommuterRail(event.detail.show);
    };
    
    const handleToggleStationLabels = (event) => {
      setShowStationLabels(event.detail.show);
    };
    
    const handleOpenBufferAnalysis = () => {
      setShowBufferAnalysis(true);
    };
    
    const handleToggleBlueBikeStations = (event) => {
      setShowBlueBikeStations(event.detail.show);
    };

    const handleToggleSubwayStations = (event) => {
      setShowSubwayStations(event.detail.show);
    };

    const handleResetMunicipalityProfile = () => {
      // Reset all municipality profile related states
      setIntersectedTrails([]);
      setShowTrailListWindow(false);
      setSelectedTrailIndex(null);
      setHoveredTrail(null);
      setShowCommuterRail(false);
      setShowStationLabels(false);
      setShowBlueBikeStations(false); // Reset Blue Bike Stations state
      setShowSubwayStations(false); // Reset Subway Stations state
      setShowBufferAnalysis(false);
      setIsBufferActive(false);
      setBufferCenter(null);
      setBufferResults(null);
      setBufferPreviewCenter(null);
      console.log('Reset all municipality profile states');
    };
    
    const handleResetBufferAnalysis = () => {
      // Reset only buffer analysis related states
      setShowBufferAnalysis(false);
      setIsBufferActive(false);
      setBufferCenter(null);
      setBufferResults(null);
      setBufferPreviewCenter(null);
      console.log('Reset buffer analysis for new municipality');
    };
    
    window.addEventListener('openTrailList', handleOpenTrailList);
    window.addEventListener('toggleCommuterRail', handleToggleCommuterRail);
    window.addEventListener('toggleStationLabels', handleToggleStationLabels);
    window.addEventListener('toggleBlueBikeStations', handleToggleBlueBikeStations);
    window.addEventListener('toggleSubwayStations', handleToggleSubwayStations);
    window.addEventListener('openBufferAnalysis', handleOpenBufferAnalysis);
    window.addEventListener('resetMunicipalityProfile', handleResetMunicipalityProfile);
    window.addEventListener('resetBufferAnalysis', handleResetBufferAnalysis);
    
    return () => {
      window.removeEventListener('openTrailList', handleOpenTrailList);
      window.removeEventListener('toggleCommuterRail', handleToggleCommuterRail);
      window.removeEventListener('toggleStationLabels', handleToggleStationLabels);
      window.removeEventListener('toggleBlueBikeStations', handleToggleBlueBikeStations);
      window.removeEventListener('toggleSubwayStations', handleToggleSubwayStations);
      window.removeEventListener('openBufferAnalysis', handleOpenBufferAnalysis);
      window.removeEventListener('resetMunicipalityProfile', handleResetMunicipalityProfile);
      window.removeEventListener('resetBufferAnalysis', handleResetBufferAnalysis);
    };
  }, []);

  // Fetch commuter rail and bike station data when needed
  useEffect(() => {
    const fetchCommuterRailData = async () => {
      if (!commuterRailData) {
        try {
          const response = await fetch('./src/data/commuter_rail.json');
          const data = await response.json();
          setCommuterRailData(data);
        } catch (error) {
          console.error('Error fetching commuter rail data:', error);
        }
      }
    };

    const fetchCommuterRailStationsData = async () => {
      if (!commuterRailStationsData) {
        try {
          const response = await fetch('./src/data/commuter_rail_stations_point.json');
          const data = await response.json();
          setCommuterRailStationsData(data);
        } catch (error) {
          console.error('Error fetching commuter rail stations data:', error);
        }
      }
    };

    const fetchBlueBikeStationsData = async () => {
      if (!blueBikeStationsData) {
        try {
          const response = await fetch('./src/data/blue_bike_stations.json');
          const data = await response.json();
          setBlueBikeStationsData(data);
        } catch (error) {
          console.error('Error fetching blue bike stations data:', error);
        }
      }
    };

    const fetchSubwayStationsData = async () => {
      if (!subwayStationsData) {
        try {
          const response = await fetch('./src/data/subway.json');
          const data = await response.json();
          setSubwayStationsData(data);
        } catch (error) {
          console.error('Error fetching subway stations data:', error);
        }
      }
    };

    fetchCommuterRailData();
    fetchCommuterRailStationsData();
    fetchBlueBikeStationsData();
    fetchSubwayStationsData();
  }, [commuterRailData, commuterRailStationsData, blueBikeStationsData, subwayStationsData]);

  // Clear buffer when switching away from Municipality Profile
  useEffect(() => {
    if (!showMunicipalityProfileMap) {
      // Clear buffer analysis when switching back to trail filters
      setBufferCenter(null);
      setBufferResults(null);
      setIsBufferActive(false);
      setBufferPreviewCenter(null);
      setShowBufferAnalysis(false);
      console.log('Cleared buffer analysis (switched to Trail Filters)');
    }
  }, [showMunicipalityProfileMap]);

  // Auto-zoom to municipality when selected in profile view
  useEffect(() => {
    if (showMunicipalityProfileMap && selectedMunicipality && selectedMunicipality.geometry) {
      // Small delay to ensure layer is rendered before zooming
      const timer = setTimeout(() => {
        handleZoomToMunicipality(selectedMunicipality);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedMunicipality, showMunicipalityProfileMap]);

  // Listen for trail selection from municipality profile
  useEffect(() => {
    const handleTrailSelection = (event) => {
      const { trail } = event.detail;
      if (trail) {
        console.log("Trail selected from list:", trail);
        
        // Create a mock identify result to show in popup
        const mockResult = {
          layerId: trail.layerId,
          layerName: trail.layerName,
          attributes: trail.attributes
        };
        
        setSelectedTrailFromList(trail);
        setHighlightedTrail(trail);
        setIdentifyInfo([mockResult]);
        toggleIdentifyPopup(true);
        setPointIndex(0);
        
        // Try to get a center point for the trail (you might need to adjust this)
        // For now, use the current map center
        if (mapRef.current) {
          const map = mapRef.current.getMap();
          const center = map.getCenter();
          setIdentifyPoint({ lng: center.lng, lat: center.lat });
        }
      }
    };

    window.addEventListener('trailSelected', handleTrailSelection);
    return () => window.removeEventListener('trailSelected', handleTrailSelection);
  }, []);

  const getIdentifyPopup = (e) => {
    const allLayers = [
      ...existingTrails.filter((et) => trailLayers.includes(et.id)).map((et) => et["esri-id"]),
      ...proposedTrails.filter((et) => proposedLayers.includes(et.id)).map((et) => et["esri-id"]),
    ].join(",");
    if (trailLayers.length > 0 || proposedLayers.length > 0) {
      const currentMap = mapRef.current.getMap();
      const currentMapBounds = currentMap.getBounds();
      // https://geo.mapc.org:6443/arcgis/rest/services/transportation/AllTrails/MapServer/identify?geometry=-70.76687716085354,42.63667346474689&geometryType=esriGeometryPoint&sr=4326&layers=all&tolerance=3&mapExtent=-70.80280174812555,42.61677473648123,-70.75534438806021,42.64918646358444&imageDisplay=600%2C550%2C96&returnGeometry=true&returnZ=false&returnM=false&returnUnformattedValues=false&returnFieldName=false&f=pjson
      axios
        .get(TRAILMAP_IDENTIFY_SOURCE, {
          params: {
            geometry: `${e.lngLat.lng},${e.lngLat.lat}`,
            geometryType: "esriGeometryPoint",
            sr: 4326,
            layers: "visible:" + allLayers,
            tolerance: 3,
            mapExtent: `${currentMapBounds._sw.lng},${currentMapBounds._sw.lat},${currentMapBounds._ne.lng},${currentMapBounds._ne.lat}`,
            imageDisplay: `600,550,96`,
            returnGeometry: false,
            f: "pjson",
          },
        })
        .then((res) => {
          if (res.data.results.length > 0) {
            const identifyResult = [];
            for (let i = 0; i < Math.min(5, res.data.results.length); i++) {
              identifyResult.push(res.data.results[i]);
            }
            setIdentifyInfo(identifyResult);
            toggleIdentifyPopup(true);
            setIdentifyPoint(e.lngLat);
          }
        });
    }
  };
  return (
    <>
      <ShareModal url={generateShareUrl()} />
      <GlossaryModal />
      <EditModal trailObj={identifyInfo !== null ? identifyInfo[pointIndex] : null} />

      <SuccessModal />
      <FailModal />

      <div className="Map position-relative">
        <LoadingBar 
          isLoading={isQueryingTrails} 
          progress={loadingProgress} 
          message={loadingMessage} 
        />
        
        {/* Trail List Window - Draggable and Collapsible */}
        {showTrailListWindow && showMunicipalityProfileMap && (
          <TrailListWindow
            municipalityTrails={municipalityTrails}
            selectedMunicipality={selectedMunicipality}
            selectedTrailIndex={selectedTrailIndex}
            onTrailClick={handleTrailListClick}
            onClose={() => setShowTrailListWindow(false)}
          />
        )}
        
        <ReactMapGL
          ref={mapRef}
          {...viewport}
          width="100%"
          height="100%"
          cursor={isBufferActive ? "crosshair" : "default"}
          interactiveLayerIds={[
            "ma-house-districts-fill", 
            "ma-senate-districts-fill", 
            "municipalities-fill", 
            "municipality-profile-base",
            // Add GeoJSON trail layers for municipality profile
            ...(showMunicipalityProfileMap ? 
              geojsonTrailLayers.map(layer => `geojson-trail-${layer.id}`) : [])
          ]}
          onMove={(event) => {
            const newViewport = event.viewState;
            // Detect if zoom level changed to trigger hover state cleanup
            if (Math.abs(newViewport.zoom - viewport.zoom) > 0.01) {
              setIsZooming(true);
            }
            setViewport(newViewport);
          }}
          onClick={(event) => {
            // Handle buffer creation
            if (isBufferActive && event.lngLat) {
              console.log('Buffer click detected at:', event.lngLat);
              const center = { lng: event.lngLat.lng, lat: event.lngLat.lat };
              setBufferCenter(center);
              setIsBufferActive(false);
              setBufferPreviewCenter(null); // Clear preview circle
              
              // Calculate buffer analysis
              console.log('Calculating buffer analysis with radius:', bufferRadius);
              const results = calculateBufferAnalysis(center, bufferRadius);
              console.log('Buffer results:', results);
              setBufferResults(results);
              
              return; // Don't process other clicks
            }

            // Check if clicking on municipality profile map
            if (showMunicipalityProfileMap && event.features) {
              // Check for GeoJSON trail clicks - find ALL overlapping trails
              const trailFeatures = event.features.filter((f) => 
                f.layer && f.layer.id.startsWith("geojson-trail-")
              );
              
              if (trailFeatures.length > 0) {
                // Process all overlapping trail features
                const trailResults = [];
                
                trailFeatures.forEach(trailFeature => {
                  const layerId = trailFeature.layer.id.replace("geojson-trail-", "");
                  const layerInfo = geojsonTrailLayers.find(l => l.id === parseInt(layerId));
                  
                  // Match by objectid (lowercase) or OBJECTID (uppercase)
                  const clickedObjectId = trailFeature.properties?.objectid || trailFeature.properties?.OBJECTID;
                  
                  const trailData = intersectedTrails.find(trail => {
                    const trailObjectId = trail.attributes?.objectid || trail.attributes?.OBJECTID;
                    return trail.layerId === parseInt(layerId) && trailObjectId === clickedObjectId;
                  });
                  
                  if (trailData) {
                    trailResults.push({
                      layerId: trailData.layerId,
                      layerName: trailData.layerName,
                      attributes: trailData.attributes
                    });
                  }
                });
                
                if (trailResults.length > 0) {
                  // If multiple trails, highlight the first one but show all in popup
                  const firstTrail = trailResults[0];
                  const firstTrailData = intersectedTrails.find(trail => {
                    const trailObjectId = trail.attributes?.objectid || trail.attributes?.OBJECTID;
                    return trail.layerId === firstTrail.layerId && 
                           trailObjectId === (firstTrail.attributes?.objectid || firstTrail.attributes?.OBJECTID);
                  });
                  
                  if (firstTrailData) {
                    // Find the index in the trail list
                    const trailIndex = intersectedTrails.findIndex(trail => {
                      const trailObjectId = trail.attributes?.objectid || trail.attributes?.OBJECTID;
                      return trail.layerId === firstTrail.layerId && 
                             trailObjectId === (firstTrail.attributes?.objectid || firstTrail.attributes?.OBJECTID);
                    });
                    
                    if (trailIndex >= 0) {
                      setSelectedTrailIndex(trailIndex);
                    }
                    
                    // Highlight the first trail
                    setHighlightedTrail(firstTrailData);
                  }
                  
                  // Ensure we have valid coordinates for the popup
                  let popupCoords = null;
                  
                  // Try to use click coordinates first
                  if (event.lngLat && !isNaN(event.lngLat.lng) && !isNaN(event.lngLat.lat)) {
                    popupCoords = { lng: event.lngLat.lng, lat: event.lngLat.lat };
                  }
                  // Fallback to first trail geometry center
                  else if (firstTrailData && firstTrailData.geometry && firstTrailData.geometry.coordinates) {
                    const coords = firstTrailData.geometry.coordinates;
                    const coordsArray = firstTrailData.geometry.type === 'MultiLineString' ? coords[0] : coords;
                    if (coordsArray && coordsArray.length > 0) {
                      const midPoint = coordsArray[Math.floor(coordsArray.length / 2)];
                      if (midPoint && midPoint.length >= 2) {
                        popupCoords = { lng: midPoint[0], lat: midPoint[1] };
                      }
                    }
                  }
                  
                  if (popupCoords) {
                    // Force popup refresh by toggling off then on
                    toggleIdentifyPopup(false);
                    
                    // Use setTimeout to ensure state update completes
                    setTimeout(() => {
                      setIdentifyPoint(popupCoords);
                      setIdentifyInfo(trailResults); // Show all overlapping trails
                      setPointIndex(0);
                      toggleIdentifyPopup(true);
                    }, 10);
                  } else {
                    console.warn("Could not determine valid coordinates for popup");
                  }
                  
                  return;
                }
              }
              
              // Check for Blue Bike Station clicks
              const bikeStationFeature = event.features.find((f) => 
                f.layer && f.layer.id === "blue-bike-stations"
              );
              if (bikeStationFeature) {
                const stationProps = bikeStationFeature.properties;
                const stationInfo = {
                  name: stationProps?.Name || 'Unknown Station',
                  district: stationProps?.District || 'Unknown District',
                  totalDocks: stationProps?.Total_docks || 0,
                  number: stationProps?.Number || 'N/A',
                  public: stationProps?.Public_ === 'Yes' ? 'Yes' : 'No'
                };
                
                // Show popup with bike station details
                const mockResult = {
                  layerId: 'blue-bike-station',
                  layerName: 'Blue Bike Station',
                  attributes: stationInfo
                };
                
                if (event.lngLat && !isNaN(event.lngLat.lng) && !isNaN(event.lngLat.lat)) {
                  // Force popup refresh by toggling off then on
                  toggleIdentifyPopup(false);
                  
                  // Use setTimeout to ensure state update completes
                  setTimeout(() => {
                    setIdentifyPoint({ lng: event.lngLat.lng, lat: event.lngLat.lat });
                    setIdentifyInfo([mockResult]);
                    setPointIndex(0);
                    toggleIdentifyPopup(true);
                  }, 10);
                }
                
                return;
              }

              // Check for Subway Station clicks
              const subwayStationFeature = event.features.find((f) => 
                f.layer && f.layer.id === "subway-stations"
              );
              if (subwayStationFeature) {
                const stationProps = subwayStationFeature.properties;
                const stationInfo = {
                  name: stationProps?.STATION || 'Unknown Station',
                  line: stationProps?.LINE || 'Unknown Line'
                };
                
                // Show popup with subway station details
                const mockResult = {
                  layerId: 'subway-station',
                  layerName: 'MBTA Subway Station',
                  attributes: stationInfo
                };
                
                if (event.lngLat && !isNaN(event.lngLat.lng) && !isNaN(event.lngLat.lat)) {
                  // Force popup refresh by toggling off then on
                  toggleIdentifyPopup(false);
                  
                  // Use setTimeout to ensure state update completes
                  setTimeout(() => {
                    setIdentifyPoint({ lng: event.lngLat.lng, lat: event.lngLat.lat });
                    setIdentifyInfo([mockResult]);
                    setPointIndex(0);
                    toggleIdentifyPopup(true);
                  }, 10);
                }
                
                return;
              }
              
            // Check for municipality clicks
            const muniFeature = event.features.find((f) => f.layer && f.layer.id === "municipality-profile-base");
            if (muniFeature) {
              const townName = muniFeature.properties.town || muniFeature.properties.NAME;
              if (townName) {
                const muniName = townName.toLowerCase();
                setSelectedMunicipality({
                  name: muniName,
                  properties: muniFeature.properties,
                  geometry: muniFeature.geometry
                });
                // Update URL if we're on community trails profile page
                if (showMunicipalityView && location.pathname === '/communityTrailsProfile') {
                  navigate(`/communityTrailsProfile?muni=${encodeURIComponent(muniName)}`, { replace: true });
                }
                return; // Don't trigger identify popup when selecting municipality
              }
            }
            }
            
            // Check if clicking on a municipality when municipalities layer is visible
            if (showMunicipalities && event.features) {
              const muniFeature = event.features.find((f) => f.layer && f.layer.id === "municipalities-fill");
              if (muniFeature) {
                const townName = muniFeature.properties.town || muniFeature.properties.NAME;
                if (townName) {
                  const muniName = townName.toLowerCase();
                  setSelectedMunicipality({
                    name: muniName,
                    properties: muniFeature.properties,
                    geometry: muniFeature.geometry
                  });
                  // Update URL if we're on community trails profile page
                  if (showMunicipalityView && location.pathname === '/communityTrailsProfile') {
                    navigate(`/communityTrailsProfile?muni=${encodeURIComponent(muniName)}`, { replace: true });
                  }
                  return; // Don't trigger identify popup when selecting municipality
                }
              }
            }
            getIdentifyPopup(event);
          }}
          onMouseMove={(event) => {
            const map = mapRef.current && mapRef.current.getMap ? mapRef.current.getMap() : null;
            const features = event.features || [];

            // Handle buffer preview circle when drawing is active
            if (isBufferActive && event.lngLat) {
              setBufferPreviewCenter({ lng: event.lngLat.lng, lat: event.lngLat.lat });
            } else {
              setBufferPreviewCenter(null);
            }

            // Handle trail hover in municipality profile
            if (showMunicipalityProfileMap && features.length > 0) {
              const trailFeature = features.find((f) => 
                f.layer && f.layer.id.startsWith("geojson-trail-") && !f.layer.id.includes("hover")
              );
              
              if (trailFeature) {
                const layerId = trailFeature.layer.id.replace("geojson-trail-", "");
                const clickedObjectId = trailFeature.properties?.objectid || trailFeature.properties?.OBJECTID;
                
                const trailData = intersectedTrails.find(trail => {
                  const trailObjectId = trail.attributes?.objectid || trail.attributes?.OBJECTID;
                  return trail.layerId === parseInt(layerId) && trailObjectId === clickedObjectId;
                });
                
                if (trailData) {
                  setHoveredTrail(trailData);
                } else {
                  setHoveredTrail(null);
                }
              } else {
                setHoveredTrail(null);
              }
            } else {
              setHoveredTrail(null);
            }

            // Handle Blue Bike Stations hover
            if (showBlueBikeStations && showMunicipalityProfileMap) {
              const blueBikeFeature = features.find((f) => f.layer && f.layer.id === "blue-bike-stations");
              
              if (blueBikeFeature) {
                setHoveredBlueBikeStation(blueBikeFeature);
              } else {
                setHoveredBlueBikeStation(null);
              }
            } else {
              setHoveredBlueBikeStation(null);
            }

            // Handle Subway Stations hover
            if (showSubwayStations && showMunicipalityProfileMap) {
              const subwayFeature = features.find((f) => f.layer && f.layer.id === "subway-stations");
              
              if (subwayFeature) {
                setHoveredSubwayStation(subwayFeature);
              } else {
                setHoveredSubwayStation(null);
              }
            } else {
              setHoveredSubwayStation(null);
            }

            // Handle MA House Districts hover (improved detection)
            if (showMaHouseDistricts) {
              let districtFeature = features.find((f) => f.layer && f.layer.id === "ma-house-districts-fill");
              
              // Enhanced fallback using queryRenderedFeatures with larger radius
              if (!districtFeature && map) {
                const x = event.point.x;
                const y = event.point.y;
                const queried = map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], {
                  layers: ["ma-house-districts-fill"],
                });
                if (queried && queried.length > 0) {
                  districtFeature = queried[0];
                }
              }
              
              if (districtFeature) {
                setHoverFeature(districtFeature);
                setHoverPoint(event.lngLat);
                const props = districtFeature.properties || {};
                const key =
                  (props.REPDISTNUM !== undefined && "REPDISTNUM") ||
                  (props.DIST_CODE !== undefined && "DIST_CODE") ||
                  (props.OBJECTID !== undefined && "OBJECTID") ||
                  null;
                const value = key ? props[key] : null;
                setHoverFilterKey(key);
                setHoverFilterValue(value);
              } else {
                setHoverFeature(null);
                setHoverPoint(null);
                setHoverFilterKey(null);
                setHoverFilterValue(null);
              }
            }

            // Handle MA Senate Districts hover (improved detection)
            if (showMaSenateDistricts) {
              let senateFeature = features.find((f) => f.layer && f.layer.id === "ma-senate-districts-fill");
              
              // Enhanced fallback using queryRenderedFeatures with larger radius
              if (!senateFeature && map) {
                const x = event.point.x;
                const y = event.point.y;
                const queried = map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], {
                  layers: ["ma-senate-districts-fill"],
                });
                if (queried && queried.length > 0) {
                  senateFeature = queried[0];
                }
              }
              
              if (senateFeature) {
                setSenateHoverFeature(senateFeature);
                setSenateHoverPoint(event.lngLat);
                const props = senateFeature.properties || {};
                const key =
                  (props.DIST_CODE !== undefined && "DIST_CODE") ||
                  (props.OBJECTID !== undefined && "OBJECTID") ||
                  null;
                const value = key ? props[key] : null;
                setSenateHoverFilterKey(key);
                setSenateHoverFilterValue(value);
              } else {
                setSenateHoverFeature(null);
                setSenateHoverPoint(null);
                setSenateHoverFilterKey(null);
                setSenateHoverFilterValue(null);
              }
            }

            // Handle Municipalities hover (improved detection) - only for regular municipalities layer
            if (showMunicipalities) {
              let muniFeature = features.find((f) => f.layer && f.layer.id === "municipalities-fill");
              
              // Enhanced fallback using queryRenderedFeatures with larger radius
              if (!muniFeature && map) {
                const x = event.point.x;
                const y = event.point.y;
                const queried = map.queryRenderedFeatures([[x - 8, y - 8], [x + 8, y + 8]], {
                  layers: ["municipalities-fill"],
                });
                if (queried && queried.length > 0) {
                  muniFeature = queried[0];
                }
              }
              
              if (muniFeature) {
                setMuniHoverFeature(muniFeature);
                setMuniHoverPoint(event.lngLat);
                const props = muniFeature.properties || {};
                const key =
                  (props.town !== undefined && "town") ||
                  (props.NAME !== undefined && "NAME") ||
                  (props.OBJECTID !== undefined && "OBJECTID") ||
                  null;
                const value = key ? props[key] : null;
                setMuniHoverFilterKey(key);
                setMuniHoverFilterValue(value);
              } else {
                setMuniHoverFeature(null);
                setMuniHoverPoint(null);
                setMuniHoverFilterKey(null);
                setMuniHoverFilterValue(null);
              }
            }
          }}
          onMouseLeave={() => {
            setHoverFeature(null);
            setHoverPoint(null);
            setHoverFilterKey(null);
            setHoverFilterValue(null);
            setSenateHoverFeature(null);
            setSenateHoverPoint(null);
            setSenateHoverFilterKey(null);
            setSenateHoverFilterValue(null);
            setMuniHoverFeature(null);
            setMuniHoverPoint(null);
            setMuniHoverFilterKey(null);
            setMuniHoverFilterValue(null);
          }}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={baseLayer.url}
          scrollZoom={true}
          transitionDuration="1000"
        >
          {showIdentifyPopup && identifyInfo && identifyInfo.length > 0 && identifyPoint && (
            <Identify
              point={identifyPoint}
              identifyResult={identifyInfo}
              handleShowPopup={() => {
                toggleIdentifyPopup(false);
                // Clear highlighted trail when popup closes
                setHighlightedTrail(null);
                setSelectedTrailFromList(null);
                // Clear all hover states when popup closes to fix hover detection
                setHoverFeature(null);
                setHoverPoint(null);
                setHoverFilterKey(null);
                setHoverFilterValue(null);
                setSenateHoverFeature(null);
                setSenateHoverPoint(null);
                setSenateHoverFilterKey(null);
                setSenateHoverFilterValue(null);
                setMuniHoverFeature(null);
                setMuniHoverPoint(null);
                setMuniHoverFilterKey(null);
                setMuniHoverFilterValue(null);
              }}
              handleCarousel={setPointIndex}
            ></Identify>
          )}
          {showControlPanel && (
            <div>
              <ControlPanel />
              <CloseButton
                id="control-close-btn"
                onClick={() => {
                  toggleControlPanel(false);
                }}
              />
            </div>
          )}

          {!showControlPanel && (
            <Button
              id="control-open-btn"
              onClick={() => {
                toggleControlPanel(true);
              }}
            >
              <img src={FilterIcon} alt={"Show Control Panel"} />
            </Button>
          )}
          {showBasemapPanel && <BasemapPanel />}
          
          {/* Render GeoJSON sources for municipality profile */}
          {showMunicipalityProfileMap && visibleLayers()}
          
          {/* Commuter Rail Layer - only in municipality profile */}
          {showMunicipalityProfileMap && commuterRailLayers()}
          
          {/* Blue Bike Stations Layer - only in municipality profile */}
          {showMunicipalityProfileMap && blueBikeStationsLayers()}
          
          {/* MBTA Subway Stations Layer - only in municipality profile */}
          {showMunicipalityProfileMap && subwayStationsLayers()}
          
          {/* Render vector tile source for regular trail layers */}
          {!showMunicipalityProfileMap && (
            <Source id="MAPC trail vector tiles" type="vector" tiles={[TRAILMAP_SOURCE]}>
              {visibleLayers()}
            </Source>
          )}
          <Source id="MAPC landline vector tiles" type="vector" tiles={[LANDLINE_SOURCE]}>
            {landlineLayers()}
          </Source>
          <Source 
            id="ma-house-districts" 
            type="geojson" 
            data="https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/House2021/MapServer/1/query?where=1%3D1&outFields=*&f=geojson"
          >
            {maHouseDistrictsLayers()}
          </Source>
          {showMaHouseDistricts && (
            <Source 
              id="ma-house-districts-lines" 
              type="geojson" 
              data="https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/House2021/MapServer/0/query?where=1%3D1&outFields=*&f=geojson"
            />
          )}
          <Source 
            id="ma-senate-districts" 
            type="geojson" 
            data="https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Senate2021/MapServer/1/query?where=1%3D1&outFields=*&f=geojson"
          >
            {maSenateDistrictsLayers()}
          </Source>
          {showMaSenateDistricts && (
            <Source 
              id="ma-senate-districts-lines" 
              type="geojson" 
              data="https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Senate2021/MapServer/0/query?where=1%3D1&outFields=*&f=geojson"
            />
          )}
          <Source 
            id="municipalities" 
            type="geojson" 
            data={massachusettsData}
          >
            {municipalitiesLayers()}
            {municipalityProfileLayers()}
          </Source>
          
          
          {/* Buffer Analysis Layers */}
          {renderBufferPreview()}
          {renderBufferCircle()}
          {renderBufferCenter()}
          
          <GeocoderPanel MAPBOX_TOKEN={MAPBOX_TOKEN} />
          <Control
            style={"Map_filter d-block position-absolute m-0 p-0"}
            icon={FilterIcon}
            alt={"Show Control Panel"}
            clickHandler={() => toggleControlPanel(!showControlPanel)}
          />
          <Control
            style={"Map_share d-block position-absolute m-0 p-0"}
            icon={ShareIcon}
            alt={"Share Map"}
            clickHandler={() => toggleShareModal(!showShareModal)}
          />
          <Control
            style={"Map_basemap d-block position-absolute m-0 p-0"}
            icon={BasemapIcon}
            alt={"Show Baesmaps"}
            clickHandler={() => toggleBasemapPanel(!showBasemapPanel)}
          />
          {showMaHouseDistricts && hoverFeature && hoverPoint && (
            <Popup
              longitude={hoverPoint.lng}
              latitude={hoverPoint.lat}
              closeButton={false}
              closeOnMove={true}
              anchor="top"
              offset={12}
            >
              {(() => {
              
                const p = hoverFeature.properties || {};
                console.log("showMaHouseDistricts", p);
                const repName = p.REP || "";
                const distName = p.REP_DIST || "";
                const distNum = p.DIST_CODE || "";
                return (
                  <div style={{minWidth: 160, color: '#2774bd'}}>
                    {repName && <div style={{fontWeight: 600}}>Representative Name: {repName}</div>}
                    {distName && <div>District: {distName}</div>}
                    {distNum && <div>District Code: #{distNum}</div>}
                  </div>
                );
              })()}
            </Popup>
          )}
          {showMaSenateDistricts && senateHoverFeature && senateHoverPoint && (
            <Popup
              longitude={senateHoverPoint.lng}
              latitude={senateHoverPoint.lat}
              closeButton={false}
              closeOnMove={true}
              anchor="top"
              offset={12}
            >
              {(() => {
                
                const p = senateHoverFeature.properties || {};
                console.log("showMaSenateDistricts", p);
                const repName = p.SENATOR || "";
                const distName = p.SEN_DIST || "";
                const distNum = p.SENDISTNUM || "";
                return (
                  <div style={{minWidth: 160, color: '#2774bd'}}>
                    {repName && <div style={{fontWeight: 600}}>Senator: {repName}</div>}
                    {distName && <div>Senate District: {distName}</div>}
                    {distNum && <div>Senate District Number: #{distNum}</div>}
                  </div>
                );
              })()}
            </Popup>
          )}
          {showMunicipalities && muniHoverFeature && muniHoverPoint && (
            <Popup
              longitude={muniHoverPoint.lng}
              latitude={muniHoverPoint.lat}
              closeButton={false}
              closeOnMove={true}
              anchor="top"
              offset={12}
            >
              {(() => {
                const p = muniHoverFeature.properties || {};
                const townName = p.town || "N/A";
                const capitalizedTownName = townName && townName !== "N/A" ? townName.charAt(0).toUpperCase() + townName.slice(1).toLowerCase() : townName;
                return (
                  <div style={{minWidth: 160, color: '#2774bd'}}>
                    {capitalizedTownName && <div style={{fontWeight: 400}}>Municipality: {capitalizedTownName}</div>}
                  </div>
                );
              })()}
            </Popup>
          )}
          {!showMunicipalityProfileMap && <MunicipalitiesButton />}
          <MASenateDistrictsButton />
          <MAhouseDistrictsButton />
          {showOneLayerNotice && (showMunicipalities || showMaHouseDistricts || showMaSenateDistricts) && (
            <div
              className="Map_oneLayerNotice position-absolute"
              style={{
                top: 117,
                right: 11,
                background: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 12,
                color: "#333",
                zIndex: 1000
              }}
              onClick={() => setShowOneLayerNotice(false)}
            >
              For clarity, only one map (Municipalities, MA Senate, or MA House) is shown at a time
            </div>
          )}
          <ScaleControl position="bottom-right" />
          <NavigationControl className="map_navigation" position="bottom-right" />
          <GeolocateControl
            className="map_geolocate"
            positionOptions={{ enableHighAccuracy: true }}
            showUserHeading={false}
            showAccuracyCircle={false}
            showUserLocation={true}
            trackUserLocation={false}
            position="bottom-right"
          />
          {/* Trail Legend - shown when municipality is selected */}
          {showMunicipalityView && selectedMunicipality && (
            <TrailLegend />
          )}
        </ReactMapGL>
      </div>
      
      {/* Buffer Analysis Window */}
      <BufferAnalysisWindow
        show={showBufferAnalysis}
        onClose={() => setShowBufferAnalysis(false)}
        bufferResults={bufferResults}
        bufferRadius={bufferRadius}
        onRadiusChange={(newRadius) => {
          setBufferRadius(newRadius);
          // Recalculate if buffer already exists
          if (bufferCenter) {
            const results = calculateBufferAnalysis(bufferCenter, newRadius);
            setBufferResults(results);
          }
        }}
        onActivateBuffer={(clear = false) => {
          if (clear) {
            // Clear buffer
            setIsBufferActive(false);
            setBufferCenter(null);
            setBufferResults(null);
            setBufferPreviewCenter(null);
          } else if (isBufferActive) {
            // Cancel
            setIsBufferActive(false);
            setBufferPreviewCenter(null);
          } else {
            // Activate
            setIsBufferActive(true);
            setBufferCenter(null);
            setBufferResults(null);
          }
        }}
        isBufferActive={isBufferActive}
        bufferCenter={bufferCenter}
        selectedMunicipality={selectedMunicipality}
        onBlueBikeStationHover={(station) => {
          if (station) {
            // Find the corresponding feature in the blue bike stations data
            if (blueBikeStationsData && blueBikeStationsData.features) {
              const feature = blueBikeStationsData.features.find(f => 
                f.properties?.Name === station.name
              );
              if (feature) {
                setHoveredBlueBikeStation(feature);
              }
            }
          } else {
            setHoveredBlueBikeStation(null);
          }
        }}
        onCommuterRailStationHover={(station) => {
          if (station) {
            // Find the corresponding feature in the commuter rail stations data
            if (commuterRailStationsData && commuterRailStationsData.features) {
              const feature = commuterRailStationsData.features.find(f => 
                f.properties?.station === station.name
              );
              if (feature) {
                setHoveredCommuterRailStation(feature);
              }
            }
          } else {
            setHoveredCommuterRailStation(null);
          }
        }}
        onSubwayStationHover={(station) => {
          if (station) {
            // Find the corresponding feature in the subway stations data
            if (subwayStationsData && subwayStationsData.stations && subwayStationsData.stations.features) {
              const feature = subwayStationsData.stations.features.find(f => 
                f.properties?.STATION === station.name
              );
              if (feature) {
                setHoveredSubwayStation(feature);
              }
            }
          } else {
            setHoveredSubwayStation(null);
          }
        }}
        onClearBuffer={() => {
          setIsBufferActive(false);
          setBufferCenter(null);
          setBufferResults(null);
          setBufferPreviewCenter(null);
        }}
        onZoomToBuffer={() => {
          if (bufferCenter && bufferRadius) {
            // Calculate buffer extent
            const centerPoint = turf.point([bufferCenter.lng, bufferCenter.lat]);
            const bufferCircle = turf.circle(centerPoint, bufferRadius / 1000, { 
              units: 'kilometers',
              steps: 64 
            });
            
            // Get bounding box of the buffer
            const bbox = turf.bbox(bufferCircle);
            
            // Fit map to buffer extent
            if (mapRef.current && mapRef.current.getMap) {
              const map = mapRef.current.getMap();
              map.fitBounds([
                [bbox[0], bbox[1]], // Southwest corner
                [bbox[2], bbox[3]]  // Northeast corner
              ], {
                padding: 50, // Add some padding around the buffer
                maxZoom: 16   // Limit max zoom level
              });
            }
          }
        }}
        // Layer visibility states
        showCommuterRail={showCommuterRail}
        showBlueBikeStations={showBlueBikeStations}
        showSubwayStations={showSubwayStations}
        onToggleCommuterRail={setShowCommuterRail}
        onToggleBlueBikeStations={setShowBlueBikeStations}
        onToggleSubwayStations={setShowSubwayStations}
      />
    </>
  );
};

export default Map;
