import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMapGL, { NavigationControl, GeolocateControl, Source, Layer, ScaleControl, Popup } from "react-map-gl";
import bbox from "@turf/bbox";
import * as turf from "@turf/turf";
import LoadingBar from "../LoadingBar";
import TrailListWindow from "../TrailListWindow";
import BasemapPanel from "../BasemapPanel";
import Control from "./Control";
import ControlPanel from "../ControlPanel";
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import CommunityIdentify from "./CommunityIdentify";
import TrailLegend from "./TrailLegend";
import BufferAnalysisWindow from "../BufferAnalysisWindow";
import { LayerContext } from "../../App";
import massachusettsData from "../../data/massachusetts.json";
import { geojsonTrailLayers } from "./constants/geojsonTrailLayers";
import { DEFAULT_BUFFER_RADIUS } from "./constants/mapConstants";
import { queryMunicipalityTrails } from "./utils/trailQueries";
import { calculateBufferAnalysis } from "./utils/bufferAnalysis";
import CommunityTrailsProfileLayers from "./layers/CommunityTrailsProfileLayers";
import MunicipalityMapLayer from "./layers/MunicipalityMapLayer";
import CommuterRailLayers from "./layers/CommuterRailLayers";
import SubwayStationsLayers from "./layers/SubwayStationsLayers";
import BlueBikeStationsLayers from "./layers/BlueBikeStationsLayers";
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

  // Handle trail click from Trail List Window
  const handleTrailListClick = (trail, index) => {
    setSelectedTrailIndex(index);
    setHighlightedTrail(trail);
    
    let popupPoint = null;
    if (trail.geometry && trail.geometry.coordinates && trail.geometry.coordinates.length > 0) {
      const coords = trail.geometry.coordinates;
      const coordsArray = trail.geometry.type === 'MultiLineString' ? coords[0] : coords;
      
      if (coordsArray && coordsArray.length > 0) {
        const midPoint = coordsArray[Math.floor(coordsArray.length / 2)];
        if (midPoint && midPoint.length >= 2 && !isNaN(midPoint[0]) && !isNaN(midPoint[1])) {
          popupPoint = { lng: midPoint[0], lat: midPoint[1] };
        }
      }
    }
    
    if (popupPoint) {
      const mockResult = {
        attributes: trail.attributes,
        layerName: trail.layerName
      };
      
      toggleIdentifyPopup(false);
      setTimeout(() => {
        setIdentifyPoint(popupPoint);
        setIdentifyInfo([mockResult]);
        setPointIndex(0);
        toggleIdentifyPopup(true);
      }, 10);
    }
    
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
      setShowTrailListWindow(false);
      lastQueriedMunicipality.current = null;
    }
  }, [selectedMunicipality]);

  // Listen for custom events
  useEffect(() => {
    const handleOpenTrailList = () => setShowTrailListWindow(true);
    const handleToggleCommuterRail = (event) => setShowCommuterRail(event.detail.show);
    const handleToggleStationLabels = (event) => setShowStationLabels(event.detail.show);
    const handleOpenBufferAnalysis = () => setShowBufferAnalysis(true);
    const handleToggleBlueBikeStations = (event) => setShowBlueBikeStations(event.detail.show);
    const handleToggleSubwayStations = (event) => setShowSubwayStations(event.detail.show);
    
    const handleResetMunicipalityProfile = () => {
      setIntersectedTrails([]);
      setShowTrailListWindow(false);
      setSelectedTrailIndex(null);
      setHoveredTrail(null);
      setShowCommuterRail(false);
      setShowStationLabels(false);
      setShowBlueBikeStations(false);
      setShowSubwayStations(false);
      setShowBufferAnalysis(false);
      setIsBufferActive(false);
      setBufferCenter(null);
      setBufferResults(null);
      setBufferPreviewCenter(null);
    };
    
    const handleResetBufferAnalysis = () => {
      setShowBufferAnalysis(false);
      setIsBufferActive(false);
      setBufferCenter(null);
      setBufferResults(null);
      setBufferPreviewCenter(null);
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
      
      {showTrailListWindow && (
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
                  const trailIndex = intersectedTrails.findIndex(trail => {
                    const trailObjectId = trail.attributes?.objectid || trail.attributes?.OBJECTID;
                    return trail.layerId === firstTrail.layerId && 
                           trailObjectId === (firstTrail.attributes?.objectid || firstTrail.attributes?.OBJECTID);
                  });
                  
                  if (trailIndex >= 0) {
                    setSelectedTrailIndex(trailIndex);
                  }
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
        }}
        onMouseMove={(event) => {
          const features = event.features || [];

          // Handle buffer preview circle
          if (isBufferActive && event.lngLat) {
            setBufferPreviewCenter({ lng: event.lngLat.lng, lat: event.lngLat.lat });
          } else {
            setBufferPreviewCenter(null);
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
          } else {
            setHoveredTrail(null);
            setHoveredBlueBikeStation(null);
            setHoveredSubwayStation(null);
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
          <TrailLegend />
        )}
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

