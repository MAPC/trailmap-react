import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl, Popup } from "react-map-gl";
import bbox from "@turf/bbox";
import * as turf from "@turf/turf";
import LoadingBar from "../LoadingBar";
import BasemapPanel from "../BasemapPanel";
import Control from "./Control";
import ControlPanel from "../ControlPanel";
import FilterIcon from "../../assets/icons/filter-icon.svg";
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import CommunityIdentify from "./tooltip/CommunityIdentify";
import EnvironmentalJusticePopupContent from "./tooltip/EnvironmentalJusticePopupContent";
import OpenSpacePopupContent from "./tooltip/OpenSpacePopupContent";
import BlueBikeStationPopupContent from "./tooltip/BlueBikeStationPopupContent";
import TrailLegend from "./TrailLegend";
import BufferAnalysisWindow from "../BufferAnalysisWindow";
import { LayerContext } from "../../App";
import massachusettsData from "../../data/massachusetts.json";
import { trailsProfileLayers, EJ2020_MAP_SERVER_URL } from "./constants/mapConstants";
import { queryMunicipalityTrails } from "./utils/trailQueries";
import { queryFeatureAtPoint } from "./utils/arcgisPointQuery";
import { calculateBufferAnalysis } from "./utils/bufferAnalysis";
import CommunityTrailsProfileLayers from "./layers/CommunityTrailsProfileLayers";
import MunicipalityMapLayer from "./layers/MunicipalityMapLayer";
import CommuterRailLayers from "./layers/CommuterRailLayers";
import SubwayStationsLayers from "./layers/SubwayStationsLayers";
import BlueBikeStationsLayers from "./layers/BlueBikeStationsLayers";
import EnvironmentalJusticeLayer from "./layers/EnvironmentalJusticeLayer";
import OpenSpaceLayer from "./layers/OpenSpaceLayer";
import LandlinesLayer from "./layers/LandlinesLayer";
import OtherRegionalTrailsLayer from "./layers/OtherRegionalTrailsLayer";
import TransitLandStopsLayer from "./layers/TransitLandStopsLayer";
import TransitLandRoutesLayer from "./layers/TransitLandRoutesLayer";
import { renderBufferCircle, renderBufferPreview, renderBufferCenter } from "./layers/BufferLayers";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const DEFAULT_BUFFER_RADIUS = 1609; // 1 mile in meters

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
    showMunicipalityProfileMap,
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
    showOpenSpace: showOpenSpaceCommunity,
    setShowOpenSpace: setShowOpenSpaceCommunity,
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
  const [highlightedTrail, setHighlightedTrail] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [intersectedTrails, setIntersectedTrails] = useState([]);
  const [hoveredTrail, setHoveredTrail] = useState(null);
  const [hoveredBlueBikeStation, setHoveredBlueBikeStation] = useState(null);
  const [hoveredCommuterRailStation, setHoveredCommuterRailStation] = useState(null);
  const [hoveredSubwayStation, setHoveredSubwayStation] = useState(null);
  const [hoveredTransitStop, setHoveredTransitStop] = useState(null);
  const [transitStopClickInfo, setTransitStopClickInfo] = useState(null); // Store Transit Stop click info for popup
  const [blueBikeClickInfo, setBlueBikeClickInfo] = useState(null); // Store Blue Bike Station click info for popup
  const [isHoveringGeometry, setIsHoveringGeometry] = useState(false);
  
  // Use global OpenSpace state instead of local state to persist across profile switches
  const showOpenSpace = showOpenSpaceCommunity;
  
  // When Community profile mounts (e.g. switching from Regional), close EJ and OpenSpace by default
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      setShowEnvironmentalJustice(false);
      setShowOpenSpaceCommunity(false);
    }
  }, []);

  // OpenSpace click state
  const [openSpaceClickInfo, setOpenSpaceClickInfo] = useState(null);
  const [environmentalJusticeClickInfo, setEnvironmentalJusticeClickInfo] = useState(null);
  
  const queryEnvironmentalJusticeAtPoint = (lng, lat) =>
    queryFeatureAtPoint(`${EJ2020_MAP_SERVER_URL}/0`, lng, lat);

  // Listen for OpenSpace toggle events (only for Community Trails Profile)
  useEffect(() => {
    const handleToggleOpenSpace = (event) => {
      if (showMunicipalityProfileMap) {
        setShowOpenSpaceCommunity(event.detail.show);
        // Zoom to level 11 when OpenSpace is opened, only if current zoom is smaller than 11
        if (event.detail.show && mapRef?.current) {
          const map = mapRef.current.getMap();
          if (map && map.getZoom() < 11) {
            map.easeTo({
              zoom: 11,
              duration: 1000
            });
          }
        }
      }
    };
    
    window.addEventListener('toggleOpenSpace', handleToggleOpenSpace);
    return () => {
      window.removeEventListener('toggleOpenSpace', handleToggleOpenSpace);
    };
  }, [showMunicipalityProfileMap, setShowOpenSpaceCommunity, mapRef]);
  
  // Trail type visibility state - default all visible
  const [visibleTrailTypes, setVisibleTrailTypes] = useState(() => {
    // Initialize all trail types as visible by default
    const initialVisibility = {};
    trailsProfileLayers.forEach(layer => {
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
    const handleToggleOpenSpace = (event) => setShowOpenSpaceCommunity(event.detail.show);
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
      setShowOpenSpaceCommunity(false);
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
      trailsProfileLayers.forEach(layer => {
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
        cursor={isBufferActive ? "crosshair" : (isHoveringGeometry ? "pointer" : "default")}
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
          ...(showOpenSpace ? ['openspace-layer-community', 'openspace-outline-community'] : []),
          ...(showTransitLandStops ? ['transit-land-stops'] : []),
          ...(showBlueBikeStations ? ['blue-bike-stations'] : []),
          ...(showSubwayStations ? ['subway-stations'] : []),
          ...(showCommuterRail ? ['commuter-rail-stations', 'commuter-rail-station-labels'] : []),
          "municipality-profile-base",
          ...trailsProfileLayers.map(layer => `geojson-trail-${layer.id}`)
        ]}
        onMove={(event) => {
          setViewport(event.viewState);
        }}
        onClick={(event) => {
          const map = mapRef.current?.getMap();
          const queryPointFeatures = (layerIds) => {
            if (!map || !event.lngLat) return [];
            const point = [event.lngLat.lng, event.lngLat.lat];
            return map.queryRenderedFeatures(point, { layers: layerIds });
          };

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

          let allResults = [];
          if (event.features && event.lngLat) {
            
            // Collect all features from event.features
            const eventFeatures = event.features || [];
            
            // Collect GeoJSON trail features
            const trailFeatures = eventFeatures.filter((f) => 
              f.layer && f.layer.id.startsWith("geojson-trail-")
            );
            
            trailFeatures.forEach(trailFeature => {
              const layerId = trailFeature.layer.id.replace("geojson-trail-", "");
              const clickedObjectId = trailFeature.properties?.objectid || trailFeature.properties?.OBJECTID;
              
              const trailData = intersectedTrails.find(trail => {
                const trailObjectId = trail.attributes?.objectid || trail.attributes?.OBJECTID;
                return trail.layerId === parseInt(layerId) && trailObjectId === clickedObjectId;
              });
              
              if (trailData) {
                allResults.push({
                  layerId: trailData.layerId,
                  layerName: trailData.layerName,
                  attributes: trailData.attributes
                });
              }
            });
            
  
            // Collect ALL Transit Stop features 
            if (showTransitLandStops) {
              let transitStopFeatures = eventFeatures.filter((f) => 
                f.layer && f.layer.id === "transit-land-stops"
              );
              // Add all transit stops to results
              transitStopFeatures && transitStopFeatures.forEach(feature => {
                const props = feature.properties || {};
                
                const stopName = props.stop_name
                
                allResults.push({
                  layerId: 'transit-land-stop',
                  layerName: 'Transit Stop',
                  attributes: {
                    'Stop Name': stopName
                  }
                });
              });
            }
            
            // Collect ALL Blue Bike Station features
            if (showBlueBikeStations) {
              let blueBikeFeatures = eventFeatures.filter((f) => 
                f.layer && f.layer.id === "blue-bike-stations"
              );
              
              const queriedBlueBikes = queryPointFeatures(['blue-bike-stations']);
              
              queriedBlueBikes.forEach(queriedFeature => {
                const exists = blueBikeFeatures.some(existing => {
                  const existingId = existing.id || existing.properties?.Name || existing.properties?.Number;
                  const newId = queriedFeature.id || queriedFeature.properties?.Name || queriedFeature.properties?.Number;
                  return existingId && newId && existingId === newId;
                });
                if (!exists) {
                  blueBikeFeatures.push(queriedFeature);
                }
              });
      
              blueBikeFeatures.forEach(feature => {
                const props = feature.properties || {};
                allResults.push({
                  layerId: 'blue-bike-station',
                  layerName: 'Blue Bike Station',
                  attributes: {
                    name: props.Name,
                    District: props.District, 
                    'Total Docks': props.Total_docks 
                  }
                });
              });
            }
            
            // Collect ALL Subway Station features
            const subwayStationFeatures = eventFeatures.filter((f) => 
              f.layer && f.layer.id === "subway-stations"
            );
            subwayStationFeatures.forEach(feature => {
              const props = feature.properties || {};
              allResults.push({
                layerId: 'subway-station',
                layerName: 'T-stop',
                attributes: {
                  name: props.STATION, 
                  line: props.LINE 
                }
              });
            });
            

            // Collect OpenSpace features
            if (showOpenSpace) {
              const openSpaceFeatures = eventFeatures.filter((f) => 
                f.layer && (f.layer.id === 'openspace-layer-community' || f.layer.id === 'openspace-outline-community')
              );
              openSpaceFeatures.forEach(feature => {
                const props = feature.properties || {};
                allResults.push({
                  layerId: 'openspace',
                  layerName: 'OpenSpace',
                  attributes: {
                    'name': props.SITE_NAME
                  }
                });
              });
            }
            
            // Collect Municipality features (but handle separately for navigation)
            const muniFeature = eventFeatures.find((f) => f.layer && f.layer.id === "municipality-profile-base");
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
              }
            }
            
            // If we have any results, show them all in the identify popup
            if (allResults.length > 0) {
              // Clear other tooltips
              toggleIdentifyPopup(false);
              setOpenSpaceClickInfo(null);
              setTransitStopClickInfo(null);
              setBlueBikeClickInfo(null);
              setEnvironmentalJusticeClickInfo(null);
              
              // Highlight first trail if available
              const firstTrailResult = allResults.find(r => r.layerId && typeof r.layerId === 'number');
              if (firstTrailResult) {
                const firstTrailData = intersectedTrails.find(trail => {
                  const trailObjectId = trail.attributes?.objectid || trail.attributes?.OBJECTID;
                  return trail.layerId === firstTrailResult.layerId && 
                         trailObjectId === (firstTrailResult.attributes?.objectid || firstTrailResult.attributes?.OBJECTID);
                });
                if (firstTrailData) {
                  setHighlightedTrail(firstTrailData);
                }
              }
              
              let popupCoords = null;
              if (event.lngLat && !isNaN(event.lngLat.lng) && !isNaN(event.lngLat.lat)) {
                popupCoords = { lng: event.lngLat.lng, lat: event.lngLat.lat };
              }
              
              if (popupCoords) {
                setTimeout(() => {
                  setIdentifyPoint(popupCoords);
                  setIdentifyInfo(allResults);
                  setPointIndex(0);
                  toggleIdentifyPopup(true);
                }, 10);
              }
              return;
            }
          }
          
          // Check for Environmental Justice click when no vector features were clicked (EJ is raster)
          if (showEnvironmentalJustice && allResults.length === 0 && event.lngLat) {
            queryEnvironmentalJusticeAtPoint(event.lngLat.lng, event.lngLat.lat).then((ejFeature) => {
              if (ejFeature) {
                setEnvironmentalJusticeClickInfo((prev) => {
                  if (prev && prev.feature?.properties?.OBJECTID === ejFeature.properties?.OBJECTID) {
                    return null;
                  }
                  return { point: { lng: event.lngLat.lng, lat: event.lngLat.lat }, feature: ejFeature };
                });
                toggleIdentifyPopup(false);
                setOpenSpaceClickInfo(null);
                setTransitStopClickInfo(null);
                setBlueBikeClickInfo(null);
              } else {
                setEnvironmentalJusticeClickInfo(null);
              }
            });
          }
          
          // If clicking on empty space (not on any feature), close popups
          if (showOpenSpace && openSpaceClickInfo) {
            const map = mapRef.current?.getMap();
            if (map && event.lngLat) {
              const point = [event.lngLat.lng, event.lngLat.lat];
                const queriedFeatures = map.queryRenderedFeatures(point, {
                  layers: ['openspace-layer-community', 'openspace-outline-community']
                });
              if (queriedFeatures.length === 0) {
                setOpenSpaceClickInfo(null);
              }
            }
          }
          
          // Clear transit stop tooltip when clicking on empty space
          if (showTransitLandStops && transitStopClickInfo && event.lngLat) {
            const map = mapRef.current?.getMap();
            if (map) {
              const point = [event.lngLat.lng, event.lngLat.lat];
              const queriedFeatures = map.queryRenderedFeatures(point, {
                layers: ['transit-land-stops']
              });
              if (queriedFeatures.length === 0) {
                setTransitStopClickInfo(null);
              }
            }
          }
          
          // Clear blue bike station tooltip when clicking on empty space
          if (showBlueBikeStations && event.features > 0) {
            const map = mapRef.current?.getMap();
            if (map) {
              const point = [event.lngLat.lng, event.lngLat.lat];
              const queriedFeatures = map.queryRenderedFeatures(point, {
                layers: ['blue-bike-stations']
              });
              if (queriedFeatures.length === 0) {
                setBlueBikeClickInfo(null);
              }
            }
          }
          
          
          // If clicking on empty space and no features found, close identify popup and EJ popup
          if (!event.features || event.features.length === 0) {
            toggleIdentifyPopup(false);
            setEnvironmentalJusticeClickInfo(null);
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

          // Check if hovering over any interactive geometry
          let hasInteractiveFeature = false;
          
          if (features.length > 0) {
            hasInteractiveFeature = features.some((f) => {
              if (!f.layer) return false;
              const layerId = f.layer.id;
              // Check for trails
              if (layerId.startsWith("geojson-trail-") && !layerId.includes("hover")) return true;
              // Check for OpenSpace
              if (showOpenSpace && (layerId === "openspace-layer-community" || layerId === "openspace-outline-community")) return true;
              // Check for TransitLand routes
              if (showTransitLandStops && layerId === "transit-land-routes") return true;
              // Check for TransitLand stops
              if (showTransitLandStops && layerId === "transit-land-stops") return true;
              // Check for municipality
              if (layerId === "municipality-profile-base") return true;
              // Check for Blue Bike Stations
              if (showBlueBikeStations && layerId === "blue-bike-stations") return true;
              // Check for Subway Stations
              if (showSubwayStations && layerId === "subway-stations") return true;
              // Check for Commuter Rail Stations
              if (showCommuterRail && (layerId === "commuter-rail-stations" || layerId === "commuter-rail-station-labels")) return true;
              return false;
            });
          }
          
          setIsHoveringGeometry(hasInteractiveFeature);

          // Handle trail hover
          if (features.length > 0) {
            const trailFeature = features.find((f) => f.layer && f.layer.id.startsWith("geojson-trail-") && !f.layer.id.includes("hover"));
            if (trailFeature) {
              const layerId = trailFeature.layer.id.replace("geojson-trail-", "");
              const clickedObjectId = trailFeature.properties?.objectid || trailFeature.properties?.OBJECTID;
              const trailData = intersectedTrails.find((trail) => {
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
            setIsHoveringGeometry(false);
          }

        }}
        onMouseLeave={() => {
          // Clear all hover states when mouse leaves the map
          setHoveredTrail(null);
          setHoveredBlueBikeStation(null);
          setHoveredSubwayStation(null);
          setHoveredTransitStop(null);
          setIsHoveringGeometry(false);
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
            }}
            handleCarousel={setPointIndex}
          />
        )}

        {/* Environmental Justice Click Popup */}
        {showEnvironmentalJustice && environmentalJusticeClickInfo?.point && environmentalJusticeClickInfo?.feature && (
          <Popup
            longitude={environmentalJusticeClickInfo.point.lng}
            latitude={environmentalJusticeClickInfo.point.lat}
            closeButton={true}
            onClose={() => setEnvironmentalJusticeClickInfo(null)}
            anchor="top"
            offset={12}
          >
            <EnvironmentalJusticePopupContent properties={environmentalJusticeClickInfo.feature.properties} />
          </Popup>
        )}

        {/* OpenSpace Click Popup */}
        {showOpenSpace && openSpaceClickInfo?.point && openSpaceClickInfo?.feature && (
          <Popup
            longitude={openSpaceClickInfo.point.lng}
            latitude={openSpaceClickInfo.point.lat}
            closeButton={true}
            onClose={() => setOpenSpaceClickInfo(null)}
            anchor="top"
            offset={12}
          >
            <OpenSpacePopupContent properties={openSpaceClickInfo.feature.properties} />
          </Popup>
        )}

        {/* Transit Stop Click Popup */}
        {(() => {
          const shouldShowPopup = showTransitLandStops && transitStopClickInfo && transitStopClickInfo.point && transitStopClickInfo.feature;
          
          return shouldShowPopup ? (
            <Popup
              longitude={transitStopClickInfo.point.lng}
              latitude={transitStopClickInfo.point.lat}
              closeButton={true}
              onClose={() => {
                setTransitStopClickInfo(null);
              }}
              anchor="top"
              offset={12}
            >
              {(() => {
                const properties = transitStopClickInfo.feature.properties || {};
                const allProps = { ...properties };
                
                const stopName = allProps.stop_name;
                
                return (
                  <div style={{minWidth: 200, color: '#2774bd', fontSize: '12px'}}>
                    <div style={{fontWeight: 600, marginBottom: '6px'}}>Transit Stop</div>
                    <div style={{marginBottom: '4px', fontWeight: 500, wordWrap: 'break-word', overflowWrap: 'break-word'}}>{stopName}</div>
                  </div>
                );
              })()}
            </Popup>
          ) : null;
        })()}

        {/* Blue Bike Station Click Popup */}
        {showBlueBikeStations && blueBikeClickInfo?.point && blueBikeClickInfo?.feature && (
          <Popup
            longitude={blueBikeClickInfo.point.lng}
            latitude={blueBikeClickInfo.point.lat}
            closeButton={true}
            onClose={() => setBlueBikeClickInfo(null)}
            anchor="top"
            offset={12}
          >
            <BlueBikeStationPopupContent properties={blueBikeClickInfo.feature.properties} />
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
            showRegionalTrailsProfile={false}
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
          <OtherRegionalTrailsLayer
            showTrailsRegNameSync={showTrailsRegNameSync}
            showMunicipalityProfileMap={true}
            showRegionalTrailsProfile={false}
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

