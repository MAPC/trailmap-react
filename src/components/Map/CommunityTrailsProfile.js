import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl, Popup } from "react-map-gl";
import axios from "axios";
import bbox from "@turf/bbox";
import * as turf from "@turf/turf";
import LoadingBar from "../LoadingBar";
import BasemapPanel from "../BasemapPanel";
import Control from "./Control";
import ControlPanel from "../ControlPanel";
import FilterIcon from "../../assets/icons/filter-icon.svg";
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import CommunityIdentify from "./CommunityIdentify";
import TrailLegend from "./TrailLegend";
import BufferAnalysisWindow from "../BufferAnalysisWindow";
import { LayerContext } from "../../App";
import massachusettsData from "../../data/massachusetts.json";
import { geojsonTrailLayers } from "./constants/geojsonTrailLayers";
const DEFAULT_BUFFER_RADIUS = 1609; // 1 mile in meters
import { queryMunicipalityTrails } from "./utils/trailQueries";
import { calculateBufferAnalysis } from "./utils/bufferAnalysis";
import CommunityTrailsProfileLayers from "./layers/CommunityTrailsProfileLayers";
import MunicipalityMapLayer from "./layers/MunicipalityMapLayer";
import CommuterRailLayers from "./layers/CommuterRailLayers";
import SubwayStationsLayers from "./layers/SubwayStationsLayers";
import BlueBikeStationsLayers from "./layers/BlueBikeStationsLayers";
import EnvironmentalJusticeLayer from "./layers/EnvironmentalJusticeLayer";
import OpenSpaceLayer from "./layers/OpenSpaceLayer";
import LandlinesLayer from "./layers/LandlinesLayer";
import TrailsRegNameSyncLayer from "./layers/TrailsRegNameSyncLayer";
import TransitLandStopsLayer from "./layers/TransitLandStopsLayer";
import TransitLandRoutesLayer from "./layers/TransitLandRoutesLayer";
import { renderBufferCircle, renderBufferPreview, renderBufferCenter } from "./layers/BufferLayers";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;

const CommunityTrailsProfile = ({ 
  viewport, 
  setViewport, 
  baseLayer, 
  showBasemapPanel, 
  toggleBasemapPanel,
  showControlPanel,
  toggleControlPanel,
  mapRef
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    selectedMunicipality,
    setSelectedMunicipality,
    municipalityTrails,
    setMunicipalityTrails,
    showMunicipalityView,
    showCommuterRail,
    setShowCommuterRail,
    showStationLabels,
    setShowStationLabels,
    showBlueBikeStations,
    setShowBlueBikeStations,
    showSubwayStations,
    setShowSubwayStations,
    showEnvironmentalJustice,
    setShowEnvironmentalJustice,
    showOpenSpace,
    setShowOpenSpace,
    showLandlinesFeatureService,
    setShowLandlinesFeatureService,
    showTrailsRegNameSync,
    setShowTrailsRegNameSync,
    showTransitLandStops,
    setShowTransitLandStops,
  } = useContext(LayerContext);

  const [showIdentifyPopup, toggleIdentifyPopup] = useState(false);
  const [identifyInfo, setIdentifyInfo] = useState(null);
  const [identifyPoint, setIdentifyPoint] = useState(null);
  const [pointIndex, setPointIndex] = useState(0);
  const [isQueryingTrails, setIsQueryingTrails] = useState(false);
  const lastQueriedMunicipality = useRef(null);
  const [selectedTrailFromList, setSelectedTrailFromList] = useState(null);
  const [highlightedTrail, setHighlightedTrail] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [intersectedTrails, setIntersectedTrails] = useState([]);
  const [hoveredTrail, setHoveredTrail] = useState(null);
  const [hoveredBlueBikeStation, setHoveredBlueBikeStation] = useState(null);
  const [hoveredCommuterRailStation, setHoveredCommuterRailStation] = useState(null);
  const [hoveredSubwayStation, setHoveredSubwayStation] = useState(null);
  const [hoveredTransitStop, setHoveredTransitStop] = useState(null);
  const [ejHoverPoint, setEjHoverPoint] = useState(null);
  const [ejHoverInfo, setEjHoverInfo] = useState(null);
  const ejIdentifyTimeoutRef = useRef(null);
  
  // OpenSpace hover state
  const [openSpaceHoverInfo, setOpenSpaceHoverInfo] = useState(null);
  
  // OpenSpace click state
  const [openSpaceClickInfo, setOpenSpaceClickInfo] = useState(null);
  
  // Handle OpenSpace hover
  const handleOpenSpaceHover = (hoverInfo) => {
    setOpenSpaceHoverInfo(hoverInfo);
  };
  
  // Trail type visibility state - default all visible
  const [visibleTrailTypes, setVisibleTrailTypes] = useState(() => {
    // Initialize all trail types as visible by default
    const initialVisibility = {};
    geojsonTrailLayers.forEach(layer => {
      initialVisibility[layer.id] = true;
    });
    return initialVisibility;
  });
  
  // Fetched data states
  const [commuterRailData, setCommuterRailData] = useState(null);
  const [commuterRailStationsData, setCommuterRailStationsData] = useState(null);
  const [blueBikeStationsData, setBlueBikeStationsData] = useState(null);
  const [subwayStationsData, setSubwayStationsData] = useState(null);
  
  // Buffer analysis states
  const [showBufferAnalysis, setShowBufferAnalysis] = useState(false);
  const [isBufferActive, setIsBufferActive] = useState(false);
  const [bufferCenter, setBufferCenter] = useState(null);
  const [bufferRadius, setBufferRadius] = useState(DEFAULT_BUFFER_RADIUS);
  const [bufferResults, setBufferResults] = useState(null);
  const [bufferPreviewCenter, setBufferPreviewCenter] = useState(null);

  // Wrapper for queryMunicipalityTrails
  const handleQueryMunicipalityTrails = async (municipality) => {
    if (isQueryingTrails) {
      console.log("Query already in progress, skipping...");
      return;
    }

    await queryMunicipalityTrails({
      municipality,
      location,
      setIsQueryingTrails,
      setLoadingProgress,
      setLoadingMessage,
      setMunicipalityTrails,
      setIntersectedTrails,
      lastQueriedMunicipality
    });
  };

  // Wrapper for calculateBufferAnalysis
  const handleCalculateBufferAnalysis = (center, radius) => {
    return calculateBufferAnalysis(
      center,
      radius,
      intersectedTrails,
      commuterRailStationsData,
      blueBikeStationsData,
      subwayStationsData
    );
  };


  // Toggle trail type visibility
  const handleToggleTrailType = (layerId) => {
    setVisibleTrailTypes(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  // Function to zoom to municipality
  const handleZoomToMunicipality = (municipality) => {
    if (municipality && municipality.geometry) {
      try {
        const [minLng, minLat, maxLng, maxLat] = bbox(municipality.geometry);
        const map = mapRef.current.getMap();
        map.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 50, duration: 1000 }
        );
      } catch (error) {
        console.error("Error zooming to municipality:", error);
      }
    }
  };

  // Query trails when municipality is selected
  useEffect(() => {
    if (selectedMunicipality) {
      handleQueryMunicipalityTrails(selectedMunicipality);
    } else {
      setMunicipalityTrails([]);
      lastQueriedMunicipality.current = null;
    }
  }, [selectedMunicipality]);

  // Listen for custom events
  useEffect(() => {
    const handleToggleCommuterRail = (event) => setShowCommuterRail(event.detail.show);
    const handleToggleStationLabels = (event) => setShowStationLabels(event.detail.show);
    const handleOpenBufferAnalysis = () => setShowBufferAnalysis(true);
    const handleToggleBlueBikeStations = (event) => setShowBlueBikeStations(event.detail.show);
    const handleToggleSubwayStations = (event) => setShowSubwayStations(event.detail.show);
    const handleToggleEnvironmentalJustice = (event) => setShowEnvironmentalJustice(event.detail.show);
    const handleToggleOpenSpace = (event) => setShowOpenSpace(event.detail.show);
    const handleToggleLandlinesFeatureService = (event) => setShowLandlinesFeatureService(event.detail.show);
    const handleToggleTrailsRegNameSync = (event) => setShowTrailsRegNameSync(event.detail.show);
    const handleToggleTransitLandStops = (event) => setShowTransitLandStops(event.detail.show);
    
    const handleResetMunicipalityProfile = () => {
      setIntersectedTrails([]);
      setHoveredTrail(null);
      setShowCommuterRail(false);
      setShowStationLabels(false);
      setShowBlueBikeStations(false);
      setShowSubwayStations(false);
      setShowEnvironmentalJustice(false);
      setShowOpenSpace(false);
      setShowLandlinesFeatureService(false);
      setShowTrailsRegNameSync(false);
      setShowTransitLandStops(false);
      setShowBufferAnalysis(false);
      setIsBufferActive(false);
      setBufferCenter(null);
      setBufferResults(null);
      setBufferPreviewCenter(null);
      // Reset trail type visibility to all visible
      const resetVisibility = {};
      geojsonTrailLayers.forEach(layer => {
        resetVisibility[layer.id] = true;
      });
      setVisibleTrailTypes(resetVisibility);
    };
    
    const handleResetBufferAnalysis = () => {
      setShowBufferAnalysis(false);
      setIsBufferActive(false);
      setBufferCenter(null);
      setBufferResults(null);
      setBufferPreviewCenter(null);
    };
    
    window.addEventListener('toggleCommuterRail', handleToggleCommuterRail);
    window.addEventListener('toggleStationLabels', handleToggleStationLabels);
    window.addEventListener('toggleBlueBikeStations', handleToggleBlueBikeStations);
    window.addEventListener('toggleSubwayStations', handleToggleSubwayStations);
    window.addEventListener('toggleEnvironmentalJustice', handleToggleEnvironmentalJustice);
    window.addEventListener('toggleOpenSpace', handleToggleOpenSpace);
    window.addEventListener('toggleLandlinesFeatureService', handleToggleLandlinesFeatureService);
    window.addEventListener('toggleTrailsRegNameSync', handleToggleTrailsRegNameSync);
    window.addEventListener('toggleTransitLandStops', handleToggleTransitLandStops);
    window.addEventListener('openBufferAnalysis', handleOpenBufferAnalysis);
    window.addEventListener('resetMunicipalityProfile', handleResetMunicipalityProfile);
    window.addEventListener('resetBufferAnalysis', handleResetBufferAnalysis);
    
    return () => {
      window.removeEventListener('toggleCommuterRail', handleToggleCommuterRail);
      window.removeEventListener('toggleStationLabels', handleToggleStationLabels);
      window.removeEventListener('toggleBlueBikeStations', handleToggleBlueBikeStations);
      window.removeEventListener('toggleSubwayStations', handleToggleSubwayStations);
      window.removeEventListener('toggleEnvironmentalJustice', handleToggleEnvironmentalJustice);
      window.removeEventListener('toggleOpenSpace', handleToggleOpenSpace);
      window.removeEventListener('toggleLandlinesFeatureService', handleToggleLandlinesFeatureService);
      window.removeEventListener('toggleTrailsRegNameSync', handleToggleTrailsRegNameSync);
      window.removeEventListener('toggleTransitLandStops', handleToggleTransitLandStops);
      window.removeEventListener('openBufferAnalysis', handleOpenBufferAnalysis);
      window.removeEventListener('resetMunicipalityProfile', handleResetMunicipalityProfile);
      window.removeEventListener('resetBufferAnalysis', handleResetBufferAnalysis);
    };
  }, []);

  // Fetch commuter rail and bike station data
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

  // Auto-zoom to municipality when selected
  useEffect(() => {
    if (selectedMunicipality && selectedMunicipality.geometry) {
      const timer = setTimeout(() => {
        handleZoomToMunicipality(selectedMunicipality);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedMunicipality]);

  return (
    <>
      <LoadingBar 
        isLoading={isQueryingTrails} 
        progress={loadingProgress} 
        message={loadingMessage} 
      />
      
      <ReactMapGL
        ref={mapRef}
        {...viewport}
        width="100%"
        height="100%"
        cursor={isBufferActive ? "crosshair" : "default"}
        transformRequest={(url, resourceType) => {
          // Use transformRequest to add API key header for Transit.land tiles
          // This is recommended by Transit.land documentation
          if (resourceType === 'Tile' && url.startsWith('https://transit.land')) {
            const apiKey = process.env.REACT_APP_TRANSIT_LAND_API_KEY;
            if (apiKey) {
              return {
                url: url,
                headers: { apikey: apiKey }
              };
            }
          }
          // For other requests, use default behavior
          return { url };
        }}
        interactiveLayerIds={[
          ...(showOpenSpace ? ['openspace-layer', 'openspace-outline'] : []),
          ...(showTransitLandStops ? ['transit-land-stops'] : []),
          "municipality-profile-base",
          ...geojsonTrailLayers.map(layer => `geojson-trail-${layer.id}`)
        ]}
        onMove={(event) => {
          setViewport(event.viewState);
        }}
        onClick={(event) => {
          // Handle buffer creation
          if (isBufferActive && event.lngLat) {
            const center = { lng: event.lngLat.lng, lat: event.lngLat.lat };
            setBufferCenter(center);
            setIsBufferActive(false);
            setBufferPreviewCenter(null);
            const results = handleCalculateBufferAnalysis(center, bufferRadius);
            setBufferResults(results);
            return;
          }

          if (event.features) {
            // Check for GeoJSON trail clicks
            const trailFeatures = event.features.filter((f) => 
              f.layer && f.layer.id.startsWith("geojson-trail-")
            );
            
            if (trailFeatures.length > 0) {
              const trailResults = [];
              
              trailFeatures.forEach(trailFeature => {
                const layerId = trailFeature.layer.id.replace("geojson-trail-", "");
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
                const firstTrail = trailResults[0];
                const firstTrailData = intersectedTrails.find(trail => {
                  const trailObjectId = trail.attributes?.objectid || trail.attributes?.OBJECTID;
                  return trail.layerId === firstTrail.layerId && 
                         trailObjectId === (firstTrail.attributes?.objectid || firstTrail.attributes?.OBJECTID);
                });
                
                if (firstTrailData) {
                  setHighlightedTrail(firstTrailData);
                }
                
                let popupCoords = null;
                if (event.lngLat && !isNaN(event.lngLat.lng) && !isNaN(event.lngLat.lat)) {
                  popupCoords = { lng: event.lngLat.lng, lat: event.lngLat.lat };
                } else if (firstTrailData && firstTrailData.geometry && firstTrailData.geometry.coordinates) {
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
                  toggleIdentifyPopup(false);
                  setTimeout(() => {
                    setIdentifyPoint(popupCoords);
                    setIdentifyInfo(trailResults);
                    setPointIndex(0);
                    toggleIdentifyPopup(true);
                  }, 10);
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
              
              const mockResult = {
                layerId: 'blue-bike-station',
                layerName: 'Blue Bike Station',
                attributes: stationInfo
              };
              
              if (event.lngLat && !isNaN(event.lngLat.lng) && !isNaN(event.lngLat.lat)) {
                toggleIdentifyPopup(false);
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
              
              const mockResult = {
                layerId: 'subway-station',
                layerName: 'MBTA Subway Station',
                attributes: stationInfo
              };
              
              if (event.lngLat && !isNaN(event.lngLat.lng) && !isNaN(event.lngLat.lat)) {
                toggleIdentifyPopup(false);
                setTimeout(() => {
                  setIdentifyPoint({ lng: event.lngLat.lng, lat: event.lngLat.lat });
                  setIdentifyInfo([mockResult]);
                  setPointIndex(0);
                  toggleIdentifyPopup(true);
                }, 10);
              }
              return;
            }

            // Check for Transit.land stops clicks
            if (showTransitLandStops) {
              let transitStopFeature = event.features?.find((f) => 
                f.layer && f.layer.id === "transit-land-stops"
              );
              
              // If not found in event.features, query the map directly
              if (!transitStopFeature && event.lngLat) {
                const map = mapRef.current?.getMap();
                if (map) {
                  const point = [event.lngLat.lng, event.lngLat.lat];
                  const queriedFeatures = map.queryRenderedFeatures(point, {
                    layers: ['transit-land-stops']
                  });
                  if (queriedFeatures.length > 0) {
                    transitStopFeature = queriedFeatures[0];
                  }
                }
              }
              
              if (transitStopFeature && event.lngLat) {
                const stopProps = transitStopFeature.properties || {};
                const stopName = stopProps?.stop_name || stopProps?.name || 'Unknown Stop';
                // Only show stop name in tooltip
                const stopInfo = {
                  'Stop Name': stopName
                };
                
                const mockResult = {
                  layerId: 'transit-land-stop',
                  layerName: 'Transit Stop',
                  attributes: stopInfo
                };
                
                if (event.lngLat && !isNaN(event.lngLat.lng) && !isNaN(event.lngLat.lat)) {
                  toggleIdentifyPopup(false);
                  setTimeout(() => {
                    setIdentifyPoint({ lng: event.lngLat.lng, lat: event.lngLat.lat });
                    setIdentifyInfo([mockResult]);
                    setPointIndex(0);
                    toggleIdentifyPopup(true);
                  }, 10);
                }
                return;
              }
            }
            
            // Check for OpenSpace clicks
            if (showOpenSpace) {
              const openSpaceFeature = event.features.find((f) => 
                f.layer && (f.layer.id === 'openspace-layer' || f.layer.id === 'openspace-outline')
              );
              
              if (openSpaceFeature && event.lngLat) {
                // If clicking on the same OpenSpace feature, close the popup
                if (openSpaceClickInfo && 
                    openSpaceClickInfo.feature.properties?.OBJECTID === openSpaceFeature.properties?.OBJECTID) {
                  setOpenSpaceClickInfo(null);
                } else {
                  setOpenSpaceClickInfo({
                    point: { lng: event.lngLat.lng, lat: event.lngLat.lat },
                    feature: openSpaceFeature
                  });
                }
                return;
              }
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
                if (showMunicipalityView && location.pathname === '/communityTrailsProfile') {
                  navigate(`/communityTrailsProfile?muni=${encodeURIComponent(muniName)}`, { replace: true });
                }
                return;
              }
            }
          }
          
          // If clicking on empty space (not on any feature), close popups
          if (showOpenSpace && openSpaceClickInfo) {
            const map = mapRef.current?.getMap();
            if (map && event.lngLat) {
              const point = [event.lngLat.lng, event.lngLat.lat];
              const queriedFeatures = map.queryRenderedFeatures(point, {
                layers: ['openspace-layer', 'openspace-outline']
              });
              if (queriedFeatures.length === 0) {
                setOpenSpaceClickInfo(null);
              }
            }
          }
          
          // If clicking on empty space and no features found, close identify popup
          if (!event.features || event.features.length === 0) {
            toggleIdentifyPopup(false);
          }
        }}
        onMouseMove={(event) => {
          const features = event.features || [];

          // Handle buffer preview circle
          if (isBufferActive && event.lngLat) {
            setBufferPreviewCenter({ lng: event.lngLat.lng, lat: event.lngLat.lat });
          } else {
            setBufferPreviewCenter(null);
          }

          // Handle OpenSpace layer hover FIRST (before other features)
          if (showOpenSpace && event.lngLat) {
            const map = mapRef.current?.getMap();
            if (map) {
              // First check event.features
              const openSpaceFeature = features.find(f => 
                f.layer && (f.layer.id === 'openspace-layer' || f.layer.id === 'openspace-outline')
              );
              
              if (openSpaceFeature) {
                setOpenSpaceHoverInfo({
                  point: event.lngLat,
                  feature: openSpaceFeature
                });
              } else {
                // If not in event.features, query the map directly
                const queriedFeatures = map.queryRenderedFeatures(event.point, {
                  layers: ['openspace-layer', 'openspace-outline']
                });
                if (queriedFeatures.length > 0) {
                  const feature = queriedFeatures.find(f => f.layer.id === 'openspace-layer') || queriedFeatures[0];
                  setOpenSpaceHoverInfo({
                    point: event.lngLat,
                    feature: feature
                  });
                } else {
                  setOpenSpaceHoverInfo(null);
                }
              }
            }
          } else {
            setOpenSpaceHoverInfo(null);
          }

          // Handle trail hover
          if (features.length > 0) {
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

            // Handle Blue Bike Stations hover
            if (showBlueBikeStations) {
              const blueBikeFeature = features.find((f) => f.layer && f.layer.id === "blue-bike-stations");
              if (blueBikeFeature) {
                setHoveredBlueBikeStation(blueBikeFeature);
              } else {
                setHoveredBlueBikeStation(null);
              }
            }

            // Handle Subway Stations hover
            if (showSubwayStations) {
              const subwayFeature = features.find((f) => f.layer && f.layer.id === "subway-stations");
              if (subwayFeature) {
                setHoveredSubwayStation(subwayFeature);
              } else {
                setHoveredSubwayStation(null);
              }
            }

            // Handle Transit.land stops hover
            if (showTransitLandStops) {
              const transitStopFeature = features.find((f) => f.layer && f.layer.id === "transit-land-stops");
              if (transitStopFeature) {
                setHoveredTransitStop(transitStopFeature);
              } else {
                setHoveredTransitStop(null);
              }
            }
          } else {
            setHoveredTrail(null);
            setHoveredBlueBikeStation(null);
            setHoveredSubwayStation(null);
            setHoveredTransitStop(null);
          }

          // Handle Environmental Justice layer hover
          // Note: Raster layers don't appear in features, so we query identify endpoint when layer is visible
          if (showEnvironmentalJustice && event.lngLat) {
            setEjHoverPoint(event.lngLat);
            
            // Debounce identify requests to avoid too many API calls
            if (ejIdentifyTimeoutRef.current) {
              clearTimeout(ejIdentifyTimeoutRef.current);
            }
            
            ejIdentifyTimeoutRef.current = setTimeout(() => {
              const EJ2020_IDENTIFY_URL = "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/identify";
              const map = mapRef.current?.getMap();
              
              if (map) {
                const mapBounds = map.getBounds();
                const sw = mapBounds.getSouthWest();
                const ne = mapBounds.getNorthEast();
                
                axios
                  .get(EJ2020_IDENTIFY_URL, {
                    params: {
                      geometry: `${event.lngLat.lng},${event.lngLat.lat}`,
                      geometryType: "esriGeometryPoint",
                      sr: 4326,
                      layers: "all:0",
                      tolerance: 5,
                      mapExtent: `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`,
                      imageDisplay: `${map.getContainer().clientWidth || 1024},${map.getContainer().clientHeight || 768},96`,
                      returnGeometry: false,
                      f: "pjson",
                    },
                  })
                  .then((res) => {
                    if (res.data.results && res.data.results.length > 0) {
                      setEjHoverInfo(res.data.results[0]);
                    } else {
                      setEjHoverInfo(null);
                    }
                  })
                  .catch((error) => {
                    console.error("Error identifying EJ feature:", error);
                    setEjHoverInfo(null);
                  });
              }
            }, 200);
          } else {
            // Clear EJ hover when layer is not visible
            setEjHoverPoint(null);
            setEjHoverInfo(null);
            if (ejIdentifyTimeoutRef.current) {
              clearTimeout(ejIdentifyTimeoutRef.current);
            }
          }
        }}
        onMouseLeave={() => {
          // Clear all hover states when mouse leaves the map
          setHoveredTrail(null);
          setHoveredBlueBikeStation(null);
          setHoveredSubwayStation(null);
          setHoveredTransitStop(null);
          setOpenSpaceHoverInfo(null);
          setEjHoverPoint(null);
          setEjHoverInfo(null);
          if (ejIdentifyTimeoutRef.current) {
            clearTimeout(ejIdentifyTimeoutRef.current);
          }
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={baseLayer.url}
        scrollZoom={true}
        transitionDuration="1000"
      >
        {showIdentifyPopup && identifyInfo && identifyInfo.length > 0 && identifyPoint && (
          <CommunityIdentify
            point={identifyPoint}
            identifyResult={identifyInfo}
            handleShowPopup={() => {
              toggleIdentifyPopup(false);
              setHighlightedTrail(null);
              setSelectedTrailFromList(null);
            }}
            handleCarousel={setPointIndex}
          />
        )}

        {/* Environmental Justice Tooltip */}
        {showEnvironmentalJustice && ejHoverPoint && ejHoverInfo && (
          <Popup
            longitude={ejHoverPoint.lng}
            latitude={ejHoverPoint.lat}
            closeButton={false}
            closeOnMove={true}
            anchor="top"
            offset={12}
          >
            {(() => {
              const attributes = ejHoverInfo.attributes || {};
              const layerName = ejHoverInfo.layerName || "Environmental Justice";
              
              // Extract relevant EJ attributes
              const geographicAreaName = attributes["Geographic Area Name"] || attributes.Geographic_Area_Name || null;
              const totalHouseholds = attributes["Total Number of Households"] || attributes.Total_Number_of_Households || null;
              const totalPopulation = attributes["Total Poputation"] || attributes.Total_Poputation || attributes["Total Population"] || attributes.Total_Population || null;
              
              return (
                <div style={{minWidth: 200, color: '#2774bd', fontSize: '12px'}}>
                  <div style={{fontWeight: 600, marginBottom: '6px'}}>{layerName}</div>
                  {geographicAreaName && (
                    <div style={{marginBottom: '4px', fontWeight: 500}}>{geographicAreaName}</div>
                  )}
                  {totalHouseholds !== null && (
                    <div style={{marginBottom: '2px'}}>Total Number of Households: {totalHouseholds}</div>
                  )}
                  {totalPopulation !== null && (
                    <div style={{marginBottom: '2px'}}>Total Population: {totalPopulation}</div>
                  )}
                  {!geographicAreaName && !totalHouseholds && totalPopulation === null && (
                    <div>No data available</div>
                  )}
                </div>
              );
            })()}
          </Popup>
        )}

        {/* OpenSpace Hover Tooltip */}
        {showOpenSpace && openSpaceHoverInfo && openSpaceHoverInfo.point && openSpaceHoverInfo.feature && !openSpaceClickInfo && (
          <Popup
            longitude={openSpaceHoverInfo.point.lng}
            latitude={openSpaceHoverInfo.point.lat}
            closeButton={false}
            closeOnMove={true}
            anchor="top"
            offset={12}
          >
            {(() => {
              const properties = openSpaceHoverInfo.feature.properties || {};
              
              return (
                <div style={{minWidth: 200, color: '#2774bd', fontSize: '12px'}}>
                  <div style={{fontWeight: 600, marginBottom: '6px'}}>OpenSpace</div>
                  {properties.SITE_NAME && (
                    <div style={{marginBottom: '4px', fontWeight: 500}}>{properties.SITE_NAME}</div>
                  )}
                  {properties.FEE_OWNER && (
                    <div style={{marginBottom: '2px'}}>Owner: {properties.FEE_OWNER}</div>
                  )}
                  {properties.OWNER_TYPE && (
                    <div style={{marginBottom: '2px'}}>Owner Type: {properties.OWNER_TYPE}</div>
                  )}
                  {properties.PRIM_PURP && (
                    <div style={{marginBottom: '2px'}}>Primary Purpose: {properties.PRIM_PURP}</div>
                  )}
                  {properties.PUB_ACCESS && (
                    <div style={{marginBottom: '2px'}}>Public Access: {properties.PUB_ACCESS}</div>
                  )}
                  {properties.GIS_ACRES !== null && properties.GIS_ACRES !== undefined && (
                    <div style={{marginBottom: '2px'}}>Acres: {parseFloat(properties.GIS_ACRES).toFixed(2)}</div>
                  )}
                  {!properties.SITE_NAME && !properties.FEE_OWNER && (
                    <div>No data available</div>
                  )}
                </div>
              );
            })()}
          </Popup>
        )}
        
        {/* OpenSpace Click Popup */}
        {showOpenSpace && openSpaceClickInfo && openSpaceClickInfo.point && openSpaceClickInfo.feature && (
          <Popup
            longitude={openSpaceClickInfo.point.lng}
            latitude={openSpaceClickInfo.point.lat}
            closeButton={true}
            onClose={() => setOpenSpaceClickInfo(null)}
            anchor="top"
            offset={12}
          >
            {(() => {
              const properties = openSpaceClickInfo.feature.properties || {};
              
              return (
                <div style={{minWidth: 200, color: '#2774bd', fontSize: '12px'}}>
                  <div style={{fontWeight: 600, marginBottom: '6px'}}>OpenSpace</div>
                  {properties.SITE_NAME && (
                    <div style={{marginBottom: '4px', fontWeight: 500}}>{properties.SITE_NAME}</div>
                  )}
                  {properties.FEE_OWNER && (
                    <div style={{marginBottom: '2px'}}>Owner: {properties.FEE_OWNER}</div>
                  )}
                  {properties.OWNER_TYPE && (
                    <div style={{marginBottom: '2px'}}>Owner Type: {properties.OWNER_TYPE}</div>
                  )}
                  {properties.PRIM_PURP && (
                    <div style={{marginBottom: '2px'}}>Primary Purpose: {properties.PRIM_PURP}</div>
                  )}
                  {properties.PUB_ACCESS && (
                    <div style={{marginBottom: '2px'}}>Public Access: {properties.PUB_ACCESS}</div>
                  )}
                  {properties.GIS_ACRES !== null && properties.GIS_ACRES !== undefined && (
                    <div style={{marginBottom: '2px'}}>Acres: {parseFloat(properties.GIS_ACRES).toFixed(2)}</div>
                  )}
                  {!properties.SITE_NAME && !properties.FEE_OWNER && (
                    <div>No data available</div>
                  )}
                </div>
              );
            })()}
          </Popup>
        )}
        
        {showControlPanel && (
          <div>
            <ControlPanel />
          </div>
        )}

        {showBasemapPanel && <BasemapPanel />}
        
        {/* Render GeoJSON sources for community trails profile */}
        <CommunityTrailsProfileLayers
          showMunicipalityProfileMap={true}
          intersectedTrails={intersectedTrails}
          hoveredTrail={hoveredTrail}
          highlightedTrail={highlightedTrail}
          visibleTrailTypes={visibleTrailTypes}
        />
        
        {/* Commuter Rail Layer */}
        <CommuterRailLayers
          showCommuterRail={showCommuterRail}
          showMunicipalityProfileMap={true}
          commuterRailData={commuterRailData}
          commuterRailStationsData={commuterRailStationsData}
          showStationLabels={showStationLabels}
          hoveredCommuterRailStation={hoveredCommuterRailStation}
        />
        
        {/* Blue Bike Stations Layer */}
        <BlueBikeStationsLayers
          showBlueBikeStations={showBlueBikeStations}
          showMunicipalityProfileMap={true}
          blueBikeStationsData={blueBikeStationsData}
          hoveredBlueBikeStation={hoveredBlueBikeStation}
        />
        
        {/* MBTA Subway Stations Layer */}
        <SubwayStationsLayers
          showSubwayStations={showSubwayStations}
          showMunicipalityProfileMap={true}
          subwayStationsData={subwayStationsData}
          hoveredSubwayStation={hoveredSubwayStation}
        />
        
        {/* Environmental Justice 2020 Layer */}
        <EnvironmentalJusticeLayer
          showEnvironmentalJustice={showEnvironmentalJustice}
          showMunicipalityProfileMap={true}
          mapRef={mapRef}
        />

        {/* OpenSpace Layer */}
        {showOpenSpace && (
          <OpenSpaceLayer
            showOpenSpace={showOpenSpace}
            showMunicipalityProfileMap={true}
            mapRef={mapRef}
          />
        )}

        {/* Landlines Feature Service Layer */}
        {showLandlinesFeatureService && (
          <LandlinesLayer
            showLandlines={showLandlinesFeatureService}
            showMunicipalityProfileMap={true}
            mapRef={mapRef}
          />
        )}

        {/* Trails Reg Name Sync Layer */}
        {showTrailsRegNameSync && (
          <TrailsRegNameSyncLayer
            showTrailsRegNameSync={showTrailsRegNameSync}
            showMunicipalityProfileMap={true}
            showProjectTrailsProfile={false}
            mapRef={mapRef}
          />
        )}

        {/* Transit.land Routes Layer - shown when stops are visible */}
        <TransitLandRoutesLayer
          showTransitLandRoutes={showTransitLandStops}
          showMunicipalityProfileMap={true}
        />
        
        {/* Transit.land Stops Layer */}
        <TransitLandStopsLayer
          showTransitLandStops={showTransitLandStops}
          showMunicipalityProfileMap={true}
          hoveredTransitStop={hoveredTransitStop}
        />
        
        <Source 
          id="municipalities" 
          type="geojson" 
          data={massachusettsData}
        >
          <MunicipalityMapLayer
            showMunicipalityProfileMap={true}
            selectedMunicipality={selectedMunicipality}
          />
        </Source>
        
        {/* Buffer Analysis Layers */}
        {renderBufferPreview(bufferPreviewCenter, isBufferActive, bufferRadius)}
        {renderBufferCircle(bufferCenter, bufferRadius)}
        {renderBufferCenter(bufferCenter)}
        
        <GeocoderPanel MAPBOX_TOKEN={MAPBOX_TOKEN} />
        
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
        
        {/* Trail Legend */}
        {showMunicipalityView && selectedMunicipality && (
          <TrailLegend 
            visibleTrailTypes={visibleTrailTypes}
            onToggleTrailType={handleToggleTrailType}
          />
        )}
        
        {/* Control Panel Toggle Button */}
        <Control
          style={"Map_filter d-block position-absolute m-0 p-0"}
          icon={FilterIcon}
          alt={"Show Control Panel"}
          clickHandler={() => toggleControlPanel(!showControlPanel)}
        />
      </ReactMapGL>
      
      {/* Buffer Analysis Window */}
      <BufferAnalysisWindow
        show={showBufferAnalysis}
        onClose={() => setShowBufferAnalysis(false)}
        bufferResults={bufferResults}
        bufferRadius={bufferRadius}
        onRadiusChange={(newRadius) => {
          setBufferRadius(newRadius);
          if (bufferCenter) {
            const results = handleCalculateBufferAnalysis(bufferCenter, newRadius);
            setBufferResults(results);
          }
        }}
        onActivateBuffer={(clear = false) => {
          if (clear) {
            setIsBufferActive(false);
            setBufferCenter(null);
            setBufferResults(null);
            setBufferPreviewCenter(null);
          } else if (isBufferActive) {
            setIsBufferActive(false);
            setBufferPreviewCenter(null);
          } else {
            setIsBufferActive(true);
            setBufferCenter(null);
            setBufferResults(null);
          }
        }}
        isBufferActive={isBufferActive}
        bufferCenter={bufferCenter}
        selectedMunicipality={selectedMunicipality}
        onBlueBikeStationHover={(station) => {
          if (station && blueBikeStationsData && blueBikeStationsData.features) {
            const feature = blueBikeStationsData.features.find(f => 
              f.properties?.Name === station.name
            );
            if (feature) {
              setHoveredBlueBikeStation(feature);
            }
          } else {
            setHoveredBlueBikeStation(null);
          }
        }}
        onCommuterRailStationHover={(station) => {
          if (station && commuterRailStationsData && commuterRailStationsData.features) {
            const feature = commuterRailStationsData.features.find(f => 
              f.properties?.station === station.name
            );
            if (feature) {
              setHoveredCommuterRailStation(feature);
            }
          } else {
            setHoveredCommuterRailStation(null);
          }
        }}
        onSubwayStationHover={(station) => {
          if (station && subwayStationsData && subwayStationsData.stations && subwayStationsData.stations.features) {
            const feature = subwayStationsData.stations.features.find(f => 
              f.properties?.STATION === station.name
            );
            if (feature) {
              setHoveredSubwayStation(feature);
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
            const centerPoint = turf.point([bufferCenter.lng, bufferCenter.lat]);
            const bufferCircle = turf.circle(centerPoint, bufferRadius / 1000, { 
              units: 'kilometers',
              steps: 64 
            });
            const bbox = turf.bbox(bufferCircle);
            
            if (mapRef.current && mapRef.current.getMap) {
              const map = mapRef.current.getMap();
              map.fitBounds([
                [bbox[0], bbox[1]],
                [bbox[2], bbox[3]]
              ], {
                padding: 50,
                maxZoom: 16
              });
            }
          }
        }}
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

export default CommunityTrailsProfile;

