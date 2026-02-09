import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMapGL, { NavigationControl, GeolocateControl, ScaleControl, Popup, Source, Layer } from "react-map-gl";
import BasemapPanel from "../BasemapPanel";
import ControlPanel from "../ControlPanel";
import Control from "./Control";
import FilterIcon from "../../assets/icons/filter-icon.svg";
import CommunityIdentify from "./CommunityIdentify";
import ProjectMetricsPanel from "./ProjectMetricsPanel";
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import { LayerContext } from "../../App";
import OtherRegionalTrailsLayer from "./layers/OtherRegionalTrailsLayer";
import MajorTrailsLayer from "./layers/MajorTrailsLayer";
import OpenSpaceLayer from "./layers/OpenSpaceLayer";
import EnvironmentalJusticeLayer from "./layers/EnvironmentalJusticeLayer";
import massachusettsData from "../../data/massachusetts.json";
import muniKeys from "../../data/ma_muni_keys.json";
import * as turf from "@turf/turf";
import bbox from "@turf/bbox";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;

const RegionalTrailsProfile = ({ 
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
    showTrailsRegNameSync,
    setShowTrailsRegNameSync,
    basemaps,
    setProjectRegNames,
    setSelectedProjectRegName,
    setProjectColorPalette,
    showMunicipalities,
    toggleMunicipalities,
    showOpenSpace: showOpenSpaceFromContext,
    setShowOpenSpace: setShowOpenSpaceFromContext,
    showEnvironmentalJustice,
    setShowEnvironmentalJustice,
  } = useContext(LayerContext);

  const [showIdentifyPopup, toggleIdentifyPopup] = useState(false);
  const [identifyInfo, setIdentifyInfo] = useState(null);
  const [identifyPoint, setIdentifyPoint] = useState(null);
  const [pointIndex, setPointIndex] = useState(0);
  const [regNames, setRegNames] = useState([]);
  const [selectedRegNames, setSelectedRegNames] = useState(new Set()); // Track selected projects (Set for easy toggle)
  const [selectedMajorTrails, setSelectedMajorTrails] = useState([]); // Track selected major trails (array of grouped_reg_name values)

  // Reset selected projects when entering Regional Trails Profile and show municipalities by default
  useEffect(() => {
    if (location.pathname === '/regionalTrailsProfile') {
      setSelectedRegNames(new Set());
      setSelectedMajorTrails([]);
      // Show municipalities by default
      toggleMunicipalities(true);
    }
  }, [location.pathname, toggleMunicipalities]);
  const [hoveredTrail, setHoveredTrail] = useState(null);
  const [colorPalette, setColorPalette] = useState({});
  const allRegNamesRef = useRef(new Set()); // Track all unique reg_names seen using ref
  const [allTrailsData, setAllTrailsData] = useState(null); // Store all trail data from OtherRegionalTrailsLayer
  const [majorTrailsData, setMajorTrailsData] = useState(null); // Store all major trail data from MajorTrailsLayer
  
  // Use global OpenSpace state instead of local state to persist across profile switches
  const showOpenSpace = showOpenSpaceFromContext;
  
  const [openSpaceClickInfo, setOpenSpaceClickInfo] = useState(null); // Store OpenSpace click info for popup
  
  // Listen for OpenSpace toggle events (only for Regional Trails Profile)
  useEffect(() => {
    const handleToggleOpenSpace = (event) => {
      if (location.pathname === '/regionalTrailsProfile') {
        setShowOpenSpaceFromContext(event.detail.show);
        // Zoom to level 11 when OpenSpace is opened
        if (event.detail.show && mapRef?.current) {
          const map = mapRef.current.getMap();
          if (map) {
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
  }, [location.pathname, setShowOpenSpaceFromContext, mapRef]);
  const [environmentalJusticeClickInfo, setEnvironmentalJusticeClickInfo] = useState(null); // Store Environmental Justice click info for popup
  const [majorTrailClickInfo, setMajorTrailClickInfo] = useState(null); // Store Major Trail click info for popup
  const [regularTrailClickInfo, setRegularTrailClickInfo] = useState(null); // Store Regular Trail click info for popup

  // Helper function to get municipality name from muni_id
  const getMunicipalityName = (muniId) => {
    if (!muniId || muniId === "Null" || muniId === "" || muniId === 0) return null;
    const municipality = muniKeys.find(
      (muni) =>
        muni.muni_id === parseInt(muniId) ||
        muni.muni_id === muniId ||
        muni.muni_id.toString() === muniId.toString()
    );
    return municipality ? municipality.muni_name : null;
  };

  // Get trail type label based on seg_type and fac_stat
  const getTrailTypeLabel = (segType, facStat) => {
    const key = `${segType},${facStat}`;
    const typeMap = {
      "1,1": "Shared Use Path - Existing",
      "1,2": "Shared Use Path - Design",
      "1,3": "Shared Use Path - Envisioned",
      "6,3": "Shared Use Path - Unimproved Surface",
      "6,1": "Shared Use Path - Unimproved Surface",
      "6,2": "Shared Use Path - Unimproved Surface",
      "2,1": "Protected Bike Lane and Sidewalk",
      "2,2": "Protected Bike Lane - Design or Construction",
      "2,3": "Protected Bike Lane - Design or Construction",
      "3,1": "Bike Lane and Sidewalk",
      "3,2": "Bike Lane - Design or Construction",
      "3,3": "Bike Lane - Design or Construction",
      "4,3": "Shared Street - Urban",
      "4,1": "Shared Street - Urban",
      "5,1": "Shared Street - Suburban",
      "5,3": "Shared Street - Envisioned",
      "9,1": "Gap - Facility Type TBD",
      "9,2": "Gap - Facility Type TBD",
      "9,3": "Gap - Facility Type TBD",
      "11,1": "Foot Trail - Natural Surface",
      "11,3": "Foot Trail - Envisioned Natural Surface",
      "11,2": "Foot Trail - Envisioned Natural Surface",
      "12,1": "Foot Trail - Roadway Section",
      "12,2": "Foot Trail - Envisioned Roadway Section",
      "12,3": "Foot Trail - Envisioned Roadway Section"
    };
    
    return typeMap[key] || "Unknown Trail Type";
  };

  // Color palette generation function
  const generateColorPalette = (regNamesArray) => {
    const colors = [
      "#FF6B35", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
      "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52BE80",
      "#EC7063", "#5DADE2", "#F1948A", "#58D68D", "#F4D03F",
      "#AF7AC5", "#7FB3D3", "#F5B041", "#82E0AA", "#F39C12",
      "#E74C3C", "#3498DB", "#E67E22", "#1ABC9C", "#9B59B6",
      "#34495E", "#16A085", "#27AE60", "#2980B9", "#8E44AD"
    ];
    
    const palette = {};
    regNamesArray.forEach((name, index) => {
      if (name && name.trim() !== "") {
        palette[name] = colors[index % colors.length];
      }
    });
    
    return palette;
  };

  // Update color palette when new reg_names are discovered
  useEffect(() => {
    if (regNames.length > 0) {
      // Add new reg_names to the ref set
      const previousSize = allRegNamesRef.current.size;
      regNames.forEach(name => {
        if (name && name.trim() !== "") {
          allRegNamesRef.current.add(name);
        }
      });

      // Only update if we have new reg_names
      if (allRegNamesRef.current.size !== previousSize) {
        // Generate stable color palette based on sorted reg_names
        const sortedRegNames = Array.from(allRegNamesRef.current).sort();
        const palette = generateColorPalette(sortedRegNames);
        
        setColorPalette(palette);
        if (setProjectRegNames) setProjectRegNames(sortedRegNames);
        if (setProjectColorPalette) setProjectColorPalette(palette);
      } else {
        // Even if no new reg_names, update context with current regNames
        if (setProjectRegNames) setProjectRegNames(regNames);
      }
    }
  }, [regNames, setProjectRegNames, setProjectColorPalette]);

  // Update selected reg names in context
  useEffect(() => {
    if (setSelectedProjectRegName) {
      // Convert Set to array for context (or pass first selected if single selection expected)
      const selectedArray = Array.from(selectedRegNames);
      setSelectedProjectRegName(selectedArray.length > 0 ? selectedArray[0] : null);
    }
  }, [selectedRegNames, setSelectedProjectRegName]);

  // Function to zoom to a specific project by regName (works for both regular projects and major trails)
  const handleZoomToProject = (regName) => {
    const map = mapRef.current?.getMap();
    if (!map || !regName) {
      return;
    }

    let trailsToZoom = [];

    // Check if it's a major trail (check selectedMajorTrails)
    if (selectedMajorTrails.includes(regName) && majorTrailsData && majorTrailsData.features) {
      trailsToZoom = majorTrailsData.features.filter(feature => {
        const groupedRegName = (feature.properties?.grouped_reg_name || "").trim();
        return groupedRegName === regName.trim();
      });
    } 
    // Otherwise, check regular projects
    else if (allTrailsData && allTrailsData.features) {
      trailsToZoom = allTrailsData.features.filter(feature => {
        const featureRegName = (feature.properties?.reg_name || "").trim();
        return featureRegName === regName.trim();
      });
    }

    if (trailsToZoom.length === 0) {
      return;
    }

    if (trailsToZoom.length > 0) {
      try {
        // Create a FeatureCollection with the trails
        const featureCollection = {
          type: "FeatureCollection",
          features: trailsToZoom
        };

        // Calculate bounding box
        const bounds = bbox(featureCollection);
        
        // Fit map to bounds with padding
        map.fitBounds(
          [
            [bounds[0], bounds[1]], // Southwest corner
            [bounds[2], bounds[3]]  // Northeast corner
          ],
          {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 1000,
            maxZoom: 15
          }
        );
      } catch (e) {
        console.warn("Error fitting bounds to project trails:", e);
      }
    }
  };

  // Zoom to selected project trails extent
  const previousSelectedRef = useRef(new Set());
  useEffect(() => {
    if (!allTrailsData || !allTrailsData.features || selectedRegNames.size === 0) {
      previousSelectedRef.current = new Set(selectedRegNames);
      return;
    }

    const map = mapRef.current?.getMap();
    if (!map) {
      previousSelectedRef.current = new Set(selectedRegNames);
      return;
    }

    // Find newly selected projects (projects that were just added)
    const newlySelected = Array.from(selectedRegNames).filter(
      regName => !previousSelectedRef.current.has(regName)
    );

    // Only zoom if a new project was just selected
    if (newlySelected.length > 0) {
      // Get trails for the newly selected project(s)
      const trailsToZoom = allTrailsData.features.filter(feature => {
        const regName = (feature.properties?.reg_name || "").trim();
        return newlySelected.some(selected => selected.trim() === regName);
      });

      if (trailsToZoom.length > 0) {
        try {
          // Create a FeatureCollection with the trails
          const featureCollection = {
            type: "FeatureCollection",
            features: trailsToZoom
          };

          // Calculate bounding box
          const bounds = bbox(featureCollection);
          
          // Fit map to bounds with padding
          map.fitBounds(
            [
              [bounds[0], bounds[1]], // Southwest corner
              [bounds[2], bounds[3]]  // Northeast corner
            ],
            {
              padding: { top: 100, bottom: 100, left: 100, right: 100 },
              duration: 1000,
              maxZoom: 15
            }
          );
        } catch (e) {
          console.warn("Error fitting bounds to project trails:", e);
        }
      }
    }

    // Update previous selected ref
    previousSelectedRef.current = new Set(selectedRegNames);
  }, [selectedRegNames, allTrailsData]);

  // Query Environmental Justice feature at a point
  const queryEnvironmentalJusticeAtPoint = async (lng, lat) => {
    try {
      // Convert lat/lon to Web Mercator (EPSG:3857)
      const toWebMercator = (lon, lat) => {
        const x = lon * 20037508.34 / 180;
        let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * 20037508.34 / 180;
        return { x, y };
      };

      const pointMerc = toWebMercator(lng, lat);
      
      // Create a small buffer around the point for querying
      const bufferRadius = 100; // meters in Web Mercator
      const pointGeometry = {
        x: pointMerc.x,
        y: pointMerc.y,
        spatialReference: { wkid: 3857 }
      };

      const EJ2020_SERVICE_URL = "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer/0";
      
      // Query using point geometry
      const params = new URLSearchParams();
      params.set("where", "1=1");
      params.set("geometry", JSON.stringify(pointGeometry));
      params.set("geometryType", "esriGeometryPoint");
      params.set("inSR", "3857");
      params.set("spatialRel", "esriSpatialRelIntersects");
      params.set("outFields", "*");
      params.set("outSR", "4326");
      params.set("f", "geojson");
      params.set("returnGeometry", "true");

      const url = `${EJ2020_SERVICE_URL}/query?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Return the first feature (closest match)
        return data.features[0];
      }
      return null;
    } catch (error) {
      console.error("Error querying Environmental Justice feature:", error);
      return null;
    }
  };

  // Handle trail click
  const handleTrailClick = async (event) => {
    const map = mapRef.current?.getMap();
    if (!map || !event.lngLat) {
      toggleIdentifyPopup(false);
      setOpenSpaceClickInfo(null);
      setEnvironmentalJusticeClickInfo(null);
      setMajorTrailClickInfo(null);
      return;
    }

    // Check for OpenSpace clicks first (before other layers, like Community Trails Profile)
    if (showOpenSpace) {
      let openSpaceFeature = null;
      
      // First try to get from event.features
      if (event.features) {
        openSpaceFeature = event.features.find((f) => 
          f.layer && (f.layer.id === 'openspace-layer-regional' || f.layer.id === 'openspace-outline-regional')
        );
      }
      
      
      // If not found in event.features, query the map directly
      if (!openSpaceFeature) {
        const centerPoint = [event.lngLat.lng, event.lngLat.lat];
        
        // Check if layers exist before querying
        const style = map.getStyle();
        const layersExist = style && style.layers && (
          style.layers.some(layer => layer.id === 'openspace-layer-regional') ||
          style.layers.some(layer => layer.id === 'openspace-outline-regional')
        );
        
        if (layersExist) {
          const layerFilter = {
            layers: ['openspace-layer-regional', 'openspace-outline-regional']
          };
          
          try {
            // First try exact point query
            let queriedFeatures = map.queryRenderedFeatures(centerPoint, layerFilter);
            if (queriedFeatures.length > 0) {
              openSpaceFeature = queriedFeatures.find(f => f.layer.id === 'openspace-layer-regional') || queriedFeatures[0];
            } else {
              // Try querying with a small tolerance for better detection
              const zoom = map.getZoom();
              const tolerance = Math.max(0.0001, 0.0005 / Math.pow(2, zoom - 10));
              
              const queryPoints = [
                centerPoint,
                [event.lngLat.lng + tolerance, event.lngLat.lat],
                [event.lngLat.lng - tolerance, event.lngLat.lat],
                [event.lngLat.lng, event.lngLat.lat + tolerance],
                [event.lngLat.lng, event.lngLat.lat - tolerance]
              ];
              
              for (const queryPoint of queryPoints) {
                try {
                  queriedFeatures = map.queryRenderedFeatures(queryPoint, layerFilter);
                  if (queriedFeatures.length > 0) {
                    openSpaceFeature = queriedFeatures.find(f => f.layer.id === 'openspace-layer-regional') || queriedFeatures[0];
                    break;
                  }
                } catch (err) {
                  // Layer might not exist, continue to next point
                  continue;
                }
              }
            }
          } catch (err) {
            // Layer doesn't exist or query failed
            console.warn('Error querying OpenSpace layers:', err.message);
          }
        }
      }
      
      if (openSpaceFeature && event.lngLat) {
        // If clicking on the same OpenSpace feature, close the popup
        if (openSpaceClickInfo && 
            openSpaceClickInfo.feature.properties?.OBJECTID === openSpaceFeature.properties?.OBJECTID) {
          setOpenSpaceClickInfo(null);
        } else {
          // Always clear existing tooltips first, then reopen
          setOpenSpaceClickInfo(null);
          toggleIdentifyPopup(false);
          setEnvironmentalJusticeClickInfo(null);
          setMajorTrailClickInfo(null);
          setRegularTrailClickInfo(null);
          
          // Use setTimeout to ensure the tooltip reopens after clearing
          setTimeout(() => {
            setOpenSpaceClickInfo({
              point: { lng: event.lngLat.lng, lat: event.lngLat.lat },
              feature: openSpaceFeature
            });
          }, 10);
        }
        return;
      }
    }

    // Check for Major Trail clicks first (before other trail layers)
    if (selectedMajorTrails && selectedMajorTrails.length > 0) {
      let majorTrailFeature = null;
      
      // First try to get from event.features
      if (event.features) {
        majorTrailFeature = event.features.find((f) => 
          f.layer && f.layer.id === "major-trails-layer"
        );
      }
      
      // If not found in event.features, query the map directly with multiple points for better line detection
      if (!majorTrailFeature) {
        const centerPoint = [event.lngLat.lng, event.lngLat.lat];
        
        // Check if layers exist before querying
        const style = map.getStyle();
        const layersExist = style && style.layers && (
          style.layers.some(layer => layer.id === 'major-trails-layer')
        );
        
        if (layersExist) {
          const layerFilter = {
            layers: ['major-trails-layer']
          };
          
          try {
            // First try exact point query
            let queriedFeatures = map.queryRenderedFeatures(centerPoint, layerFilter);
            if (queriedFeatures.length > 0) {
              majorTrailFeature = queriedFeatures[0];
            } else {
              // Try querying multiple points in a small radius around the click
              const zoom = map.getZoom();
              const tolerance = Math.max(0.0001, 0.0005 / Math.pow(2, zoom - 10));
              
              const queryPoints = [
                centerPoint,
                [event.lngLat.lng + tolerance, event.lngLat.lat],
                [event.lngLat.lng - tolerance, event.lngLat.lat],
                [event.lngLat.lng, event.lngLat.lat + tolerance],
                [event.lngLat.lng, event.lngLat.lat - tolerance]
              ];
              
              for (const queryPoint of queryPoints) {
                try {
                  queriedFeatures = map.queryRenderedFeatures(queryPoint, layerFilter);
                  if (queriedFeatures.length > 0) {
                    majorTrailFeature = queriedFeatures[0];
                    break;
                  }
                } catch (err) {
                  // Layer might not exist, continue to next point
                  continue;
                }
              }
            }
          } catch (err) {
            // Layer doesn't exist or query failed
            console.warn('Error querying major trail layers:', err.message);
          }
        }
      }
      
      if (majorTrailFeature) {
        // Always clear existing tooltips first, then reopen
        setMajorTrailClickInfo(null);
        toggleIdentifyPopup(false);
        setOpenSpaceClickInfo(null);
        setEnvironmentalJusticeClickInfo(null);
        setRegularTrailClickInfo(null);
        
        // Use setTimeout to ensure the tooltip reopens after clearing
        setTimeout(() => {
          setMajorTrailClickInfo({
            point: { lng: event.lngLat.lng, lat: event.lngLat.lat },
            feature: majorTrailFeature
          });
        }, 10);
        return;
      }
    }

    let trailFeatures = [];

    // First, try to get features from event.features
    if (event.features && event.features.length > 0) {
      trailFeatures = event.features.filter((f) => 
        f.layer && (f.layer.id === "other-regional-trails-layer" || f.layer.id === "gaps-other-regional-trails-layer")
      );
    }

    // If no features found, query the map directly with multiple points for better line detection
    if (trailFeatures.length === 0) {
      const centerPoint = [event.lngLat.lng, event.lngLat.lat];
      
      // Check if layers exist before querying
      const style = map.getStyle();
      const layersExist = style && style.layers && (
        style.layers.some(layer => layer.id === 'other-regional-trails-layer') ||
        style.layers.some(layer => layer.id === 'gaps-other-regional-trails-layer')
      );
      
      if (layersExist) {
        const layerFilter = {
          layers: ['other-regional-trails-layer', 'gaps-other-regional-trails-layer']
        };
        
        try {
          // First try exact point query
          let allFeatures = map.queryRenderedFeatures(centerPoint, layerFilter);
          trailFeatures = allFeatures.filter((f) => 
            f.layer && (f.layer.id === "other-regional-trails-layer" || f.layer.id === "gaps-other-regional-trails-layer")
          );
          
          // If still no features, try querying multiple points in a small radius around the click
          // This helps catch thin lines that might not be exactly at the click point
          if (trailFeatures.length === 0) {
            // Query points in a small cross pattern around the click point
            // Calculate tolerance based on current zoom level for better accuracy
            const zoom = map.getZoom();
            const tolerance = Math.max(0.0001, 0.0005 / Math.pow(2, zoom - 10)); // Adaptive tolerance based on zoom
            
            const queryPoints = [
              centerPoint,
              [event.lngLat.lng + tolerance, event.lngLat.lat],
              [event.lngLat.lng - tolerance, event.lngLat.lat],
              [event.lngLat.lng, event.lngLat.lat + tolerance],
              [event.lngLat.lng, event.lngLat.lat - tolerance],
              [event.lngLat.lng + tolerance, event.lngLat.lat + tolerance],
              [event.lngLat.lng - tolerance, event.lngLat.lat - tolerance],
              [event.lngLat.lng + tolerance, event.lngLat.lat - tolerance],
              [event.lngLat.lng - tolerance, event.lngLat.lat + tolerance]
            ];
            
            for (const queryPoint of queryPoints) {
              try {
                allFeatures = map.queryRenderedFeatures(queryPoint, layerFilter);
                const foundFeatures = allFeatures.filter((f) => 
                  f.layer && (f.layer.id === "other-regional-trails-layer" || f.layer.id === "gaps-other-regional-trails-layer")
                );
                if (foundFeatures.length > 0) {
                  trailFeatures = foundFeatures;
                  break;
                }
              } catch (err) {
                // Layer might not exist, continue to next point
                continue;
              }
            }
          }
        } catch (err) {
          // Layer doesn't exist or query failed, try fallback
          console.warn('Error querying trail layers:', err.message);
        }
      }
    }
    
    // Final fallback: query all layers at the point and filter (only if layers don't exist or query failed)
    if (trailFeatures.length === 0) {
      try {
        const centerPoint = [event.lngLat.lng, event.lngLat.lat];
        const allFeatures = map.queryRenderedFeatures(centerPoint);
        trailFeatures = allFeatures.filter((f) => 
          f.layer && (f.layer.id === "other-regional-trails-layer" || f.layer.id === "gaps-other-regional-trails-layer")
        );
      } catch (err) {
        // Silently fail if query doesn't work
        console.warn('Error querying all features:', err.message);
      }
    }

    if (trailFeatures.length > 0) {
      // Get the first trail feature for the tooltip
      const trailFeature = trailFeatures[0];
      
      // Always clear existing tooltips first, then reopen
      setRegularTrailClickInfo(null);
      toggleIdentifyPopup(false);
      setOpenSpaceClickInfo(null);
      setEnvironmentalJusticeClickInfo(null);
      setMajorTrailClickInfo(null);
      
      // Use setTimeout to ensure the tooltip reopens after clearing
      setTimeout(() => {
        setRegularTrailClickInfo({
          point: { lng: event.lngLat.lng, lat: event.lngLat.lat },
          feature: trailFeature
        });
      }, 10);
      return; // Exit early after setting trail click info
    }
    
    // Check for Environmental Justice clicks (only if no trail was clicked)
    // Since EJ is a raster layer, we need to query it, but only if no trail features were found
    if (showEnvironmentalJustice && trailFeatures.length === 0) {
      const ejFeature = await queryEnvironmentalJusticeAtPoint(event.lngLat.lng, event.lngLat.lat);
      if (ejFeature) {
        // If clicking on the same EJ feature, close the popup
        if (environmentalJusticeClickInfo && 
            environmentalJusticeClickInfo.feature.properties?.OBJECTID === ejFeature.properties?.OBJECTID) {
          setEnvironmentalJusticeClickInfo(null);
        } else {
          // Always clear existing tooltips first, then reopen
          setEnvironmentalJusticeClickInfo(null);
          toggleIdentifyPopup(false);
          setOpenSpaceClickInfo(null);
          setMajorTrailClickInfo(null);
          setRegularTrailClickInfo(null);
          
          // Use setTimeout to ensure the tooltip reopens after clearing
          setTimeout(() => {
            setEnvironmentalJusticeClickInfo({
              point: { lng: event.lngLat.lng, lat: event.lngLat.lat },
              feature: ejFeature
            });
          }, 10);
        }
        return;
      }
    }
    
    // If clicking on empty space, check if we should close OpenSpace popup
    if (showOpenSpace && openSpaceClickInfo) {
      const map = mapRef.current?.getMap();
      if (map && event.lngLat) {
        const point = [event.lngLat.lng, event.lngLat.lat];
        try {
          const queriedFeatures = map.queryRenderedFeatures(point, {
            layers: ['openspace-layer-regional', 'openspace-outline-regional']
          });
          if (queriedFeatures.length === 0) {
            setOpenSpaceClickInfo(null);
          }
        } catch (err) {
          // If query fails, close the popup
          setOpenSpaceClickInfo(null);
        }
      }
    }
    
    // If clicking on empty space, close popups
    toggleIdentifyPopup(false);
    setEnvironmentalJusticeClickInfo(null);
    setMajorTrailClickInfo(null);
    setRegularTrailClickInfo(null);
  };

  // Handle trail hover
  const handleTrailHover = (event) => {
    const map = mapRef.current?.getMap();
    if (!map || !event.lngLat) {
      setHoveredTrail(null);
      return;
    }

    const point = [event.lngLat.lng, event.lngLat.lat];
    let features = event.features;
    
    // If event.features is not available, query the map with error handling
    if (!features) {
      try {
        features = map.queryRenderedFeatures(point);
      } catch (err) {
        // Layer might not exist yet, set hoveredTrail to null
        console.warn('Error querying features for hover:', err.message);
        setHoveredTrail(null);
        return;
      }
    }

    // Check for major trail hover first (for cursor, but no popup)
    if (selectedMajorTrails && selectedMajorTrails.length > 0) {
      const majorTrailFeature = features.find((f) => 
        f.layer && f.layer.id === "major-trails-layer"
      );
      if (majorTrailFeature) {
        // Set hover for cursor purposes, but mark it as major trail so popup won't show
        setHoveredTrail({
          properties: majorTrailFeature.properties,
          lngLat: event.lngLat,
          featureId: majorTrailFeature.properties?.OBJECTID || 
                    majorTrailFeature.properties?.objectid || 
                    majorTrailFeature.id ||
                    null,
          isMajorTrail: true // Flag to prevent popup display
        });
        return;
      }
    }

    // Handle regular trail hover (for cursor only, no popup)
    const trailFeature = features.find((f) => 
      f.layer && (f.layer.id === "other-regional-trails-layer" || f.layer.id === "gaps-other-regional-trails-layer")
    );

    if (trailFeature) {
      // Set hover for cursor purposes only, mark as regular trail so popup won't show
      setHoveredTrail({
        properties: trailFeature.properties,
        lngLat: event.lngLat,
        featureId: trailFeature.properties?.OBJECTID || 
                  trailFeature.properties?.objectid || 
                  trailFeature.id ||
                  null,
        isRegularTrail: true // Flag to prevent hover popup display
      });
      return;
    }


    // Environmental Justice is a raster layer, so hover detection is not possible
    // Cursor will be set to pointer when clicking on it

    // No municipality hover handling - municipalities are always visible but not interactive
    setHoveredTrail(null);
  };

  // Helper function to calculate metrics for a set of trails
  const calculateTrailMetrics = (trails, name) => {
    if (!trails || trails.length === 0) {
      return {
        totalLength: 0,
        totalLengthMiles: 0,
        municipalities: []
      };
    }

    // Calculate total length and categorize by status and type
    let totalLengthFeet = 0;
    let completedLengthFeet = 0; // fac_stat = 1 means existing/completed
    const lengthByTypeExisting = {}; // Track length by trail type for existing trails
    const lengthByTypePlanned = {}; // Track length by trail type for planned trails
    const gaps = []; // Track gaps (seg_type = 9)
    
    trails.forEach(trail => {
      const props = trail.properties || {};
      const segType = props.seg_type;
      const facStat = props.fac_stat;
      const trailTypeLabel = getTrailTypeLabel(segType, facStat);
      
      // Try to get length from attributes first
      const lengthAttr = props.length_ft || 
                        props['Facility Length in Feet'] ||
                        props.Shape_Length ||
                        0;
      
      let lengthFeet = Number(lengthAttr) || 0;
      
      // If no length attribute, calculate from geometry using turf
      if (lengthFeet === 0 && trail.geometry) {
        try {
          const lengthMeters = turf.length(trail, { units: 'meters' });
          lengthFeet = lengthMeters * 3.28084; // Convert meters to feet
        } catch (e) {
          console.warn("Error calculating trail length:", e);
        }
      }
      
      totalLengthFeet += lengthFeet;
      
      // Track completed length (fac_stat = 1)
      if (facStat === 1 || facStat === "1") {
        completedLengthFeet += lengthFeet;
      }
      
      // Track gaps (seg_type = 9) separately
      if (segType === 9 || segType === "9") {
        gaps.push({
          type: trailTypeLabel,
          length: lengthFeet,
          geometry: trail.geometry
        });
      } else {
        // Track length by type, separated into existing and planned
        if (facStat === 1 || facStat === "1") {
          // Existing trails
          if (!lengthByTypeExisting[trailTypeLabel]) {
            lengthByTypeExisting[trailTypeLabel] = 0;
          }
          lengthByTypeExisting[trailTypeLabel] += lengthFeet;
        } else {
          // Planned trails (fac_stat = 2 or other values)
          if (!lengthByTypePlanned[trailTypeLabel]) {
            lengthByTypePlanned[trailTypeLabel] = 0;
          }
          lengthByTypePlanned[trailTypeLabel] += lengthFeet;
        }
      }
    });

    const totalLengthMiles = totalLengthFeet / 5280;
    const completedLengthMiles = completedLengthFeet / 5280;
    const percentageComplete = totalLengthFeet > 0 
      ? ((completedLengthFeet / totalLengthFeet) * 100).toFixed(1)
      : 0;

    // Determine which municipalities the trails are in using muni_id from feature properties
    const municipalitySet = new Set();
    
    // Helper function to get municipality name from muni_id
    const getMunicipalityName = (muniId) => {
      if (!muniId || muniId === "Null" || muniId === "" || muniId === 0) return null;
      const municipality = muniKeys.find(
        (muni) =>
          muni.muni_id === parseInt(muniId) ||
          muni.muni_id === muniId ||
          muni.muni_id.toString() === muniId.toString()
      );
      return municipality ? municipality.muni_name : null;
    };
    
    // Extract muni_id from trail properties and look up municipality name
    trails.forEach(trail => {
      const props = trail.properties || {};
      // Try different possible field names for muni_id
      const muniId = props.muni_id || 
                     props.MUNI_ID || 
                     props.muniId || 
                     props.MuniId ||
                     props.municipality_id ||
                     props.MUNICIPALITY_ID ||
                     null;
      
      if (muniId) {
        const muniName = getMunicipalityName(muniId);
        if (muniName) {
          municipalitySet.add(muniName);
        }
      }
    });

    // Parks intersection calculation removed - using VectorTileServer now
    const parksSet = new Set();

    // Get trail steward and website from first trail (assuming they're consistent for a project)
    const firstTrail = trails[0];
    const steward = firstTrail?.properties?.steward || 
                   firstTrail?.properties?.Steward || 
                   firstTrail?.properties?.STEWARD ||
                   null;
    const website = firstTrail?.properties?.website || 
                   firstTrail?.properties?.Website || 
                   firstTrail?.properties?.WEBSITE ||
                   firstTrail?.properties?.url ||
                   firstTrail?.properties?.URL ||
                   null;

    // Convert lengthByType to arrays with miles, separated by existing, planned, and gap
    const lengthByTypeExistingArray = Object.entries(lengthByTypeExisting).map(([type, feet]) => ({
      type,
      miles: (feet / 5280).toFixed(2),
      category: 'existing'
    }));
    
    const lengthByTypePlannedArray = Object.entries(lengthByTypePlanned).map(([type, feet]) => ({
      type,
      miles: (feet / 5280).toFixed(2),
      category: 'planned'
    }));
    
    const lengthByTypeGapArray = gaps.map(gap => ({
      type: gap.type,
      miles: (gap.length / 5280).toFixed(2),
      category: 'gap'
    }));

    // Combine all length by type into a single array with categories
    const lengthByTypeArray = [
      ...lengthByTypeExistingArray.map(item => ({ ...item, category: 'existing' })),
      ...lengthByTypePlannedArray.map(item => ({ ...item, category: 'planned' })),
      ...lengthByTypeGapArray.map(item => ({ ...item, category: 'gap' }))
    ];

    return {
      totalLength: totalLengthFeet,
      totalLengthMiles: totalLengthMiles.toFixed(2),
      completedLengthMiles: completedLengthMiles.toFixed(2),
      percentageComplete: percentageComplete,
      municipalities: Array.from(municipalitySet).sort(),
      parks: Array.from(parksSet).sort(),
      steward: steward,
      website: website,
      lengthByType: lengthByTypeArray,
      gaps: gaps.map(gap => ({
        type: gap.type,
        lengthMiles: (gap.length / 5280).toFixed(2)
      }))
    };
  };

  // Calculate metrics for selected projects and major trails (including hidden ones for metrics display)
  const projectMetrics = useMemo(() => {
    const metrics = {};
    
    // Process each selected regular project (include hidden ones for metrics)
    if (allTrailsData && allTrailsData.features && selectedRegNames.size > 0) {
      Array.from(selectedRegNames).forEach(regName => {
        // Filter trails for this project
        const projectTrails = allTrailsData.features.filter(
          feature => (feature.properties?.reg_name || "").trim() === regName.trim()
        );
        
        metrics[regName] = calculateTrailMetrics(projectTrails, regName);
      });
    }
    
    // Process each selected major trail
    if (majorTrailsData && majorTrailsData.features && selectedMajorTrails.length > 0) {
      selectedMajorTrails.forEach(majorTrailName => {
        // Filter trails for this major trail by grouped_reg_name
        const majorTrailTrails = majorTrailsData.features.filter(
          feature => {
            const groupedRegName = (feature.properties?.grouped_reg_name || "").trim();
            return groupedRegName === majorTrailName.trim();
          }
        );
        
        metrics[majorTrailName] = calculateTrailMetrics(majorTrailTrails, majorTrailName);
      });
    }

    return metrics;
  }, [allTrailsData, selectedRegNames, majorTrailsData, selectedMajorTrails]);


  // Get all layer IDs for trails reg name sync (always include trail layers for click detection)
  const getTrailLayerIds = () => {
    const layerIds = [];
    // Always add regular trail layers for click detection (even if no projects selected)
    layerIds.push("other-regional-trails-layer");
    layerIds.push("gaps-other-regional-trails-layer");
    // Add Major Trail layer if major trails are selected (now includes gaps)
    if (selectedMajorTrails && selectedMajorTrails.length > 0) {
      layerIds.push("major-trails-layer");
    }
    // Add OpenSpace layers if OpenSpace is shown
    if (showOpenSpace) {
      layerIds.push("openspace-layer-regional");
      layerIds.push("openspace-outline-regional");
    }
    // Add Environmental Justice layer if shown
    if (showEnvironmentalJustice) {
      layerIds.push("environmental-justice-layer-regional");
    }
    // Don't add municipalities-fill to interactive layers since we don't want hover
    return layerIds;
  };

  // Municipality layers function - always show, no hover
  const municipalitiesLayers = () => {
    const visibleMunicipalitiesLayers = [];
    // Always show municipalities in regional trails profile
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
    return visibleMunicipalitiesLayers;
  };

  // Ensure trails layers are always on top
  useEffect(() => {
    if (!mapRef?.current) return;
    
    const map = mapRef.current.getMap();
    if (!map) return;

    const ensureTrailsOnTop = () => {
      if (!map.isStyleLoaded()) {
        map.once('styledata', ensureTrailsOnTop);
        return;
      }

      try {
        // Complete list of all trail layer IDs that should be on top
        const trailLayerIds = [
          'other-regional-trails-layer',
          'other-regional-trails-layer-hover',
          'other-regional-trails-layer-click',
          'gaps-other-regional-trails-layer',
          'major-trails-layer',
          'major-trails-layer-hover',
          'major-trails-layer-click'
        ];

        // Get all layer IDs in the current style
        const style = map.getStyle();
        if (!style || !style.layers) return;

        const allLayerIds = style.layers.map(layer => layer.id);
        
        // Filter to get only existing trail layers
        const existingTrailLayers = trailLayerIds.filter(id => map.getLayer(id));
        
        if (existingTrailLayers.length === 0) return;

        // Find all non-trail layer IDs
        const nonTrailLayerIds = allLayerIds.filter(id => !trailLayerIds.includes(id));
        
        if (nonTrailLayerIds.length === 0) return;

        // Find the last non-trail layer ID - we'll move all trail layers after this
        const lastNonTrailLayerId = nonTrailLayerIds[nonTrailLayerIds.length - 1];
        
        // Move each trail layer to be after the last non-trail layer
        // Process in order to maintain relative order among trail layers
        existingTrailLayers.forEach(trailLayerId => {
          try {
            // Check current position
            const currentBeforeId = map.getLayer(trailLayerId)?.metadata?.beforeId;
            
            // Only move if not already in correct position
            // Move to be after the last non-trail layer
            map.moveLayer(trailLayerId, lastNonTrailLayerId);
          } catch (err) {
            // Layer might not exist or already in correct position - ignore
          }
        });
      } catch (err) {
        // Silently fail if there's an error
        console.warn('Error ensuring trails on top:', err);
      }
    };

    // Wait a bit for layers to be added
    const timeoutId = setTimeout(ensureTrailsOnTop, 500);
    
    // Also listen for style changes and map movements
    map.on('styledata', ensureTrailsOnTop);
    map.on('moveend', ensureTrailsOnTop);
    map.on('zoomend', ensureTrailsOnTop);
    
    return () => {
      clearTimeout(timeoutId);
      if (map && map.off) {
        map.off('styledata', ensureTrailsOnTop);
        map.off('moveend', ensureTrailsOnTop);
        map.off('zoomend', ensureTrailsOnTop);
      }
    };
  }, [mapRef, selectedRegNames, selectedMajorTrails, showOpenSpace, showEnvironmentalJustice]);

  // Ensure baseLayer and MAPBOX_TOKEN exist before rendering
  if (!baseLayer || !baseLayer.url || !MAPBOX_TOKEN) {
    return null;
  }

  return (
    <div className="regional-trails-profile-map" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <ReactMapGL
        ref={mapRef}
        {...viewport}
        width="100%"
        height="100%"
        cursor={
          hoveredTrail && (
            hoveredTrail.properties?.grouped_reg_name || 
            hoveredTrail.properties?.reg_name ||
            hoveredTrail.isMajorTrail ||
            hoveredTrail.isRegularTrail ||
            hoveredTrail.isEnvironmentalJustice
          ) ? "pointer" : "default"
        }
        interactiveLayerIds={getTrailLayerIds()}
        onMove={(event) => {
          setViewport(event.viewState);
        }}
        onClick={handleTrailClick}
        onMouseMove={handleTrailHover}
        onMouseLeave={() => {
          setHoveredTrail(null);
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={baseLayer.url}
        scrollZoom={true}
        transitionDuration="1000"
        transformRequest={(url, resourceType) => {
          // Convert ArcGIS VectorTileServer URL format from {z}/{y}/{x}.pbf to {z}/{x}/{y}.pbf for Mapbox compatibility
          if (resourceType === 'Tile' && url.includes('VectorTileServer/tile/')) {
            // ArcGIS format: /tile/{z}/{y}/{x}.pbf
            // Mapbox format: /tile/{z}/{x}/{y}.pbf
            const convertedUrl = url.replace(/\/tile\/(\d+)\/(\d+)\/(\d+)\.pbf/, (match, z, y, x) => {
              return `/tile/${z}/${x}/${y}.pbf`;
            });
            return { url: convertedUrl };
          }
          // For other requests, use default behavior
          return { url };
        }}
      >
        {/* Municipality Map Layer - always visible */}
        <Source 
          id="municipalities" 
          type="geojson" 
          data={massachusettsData}
        >
          {municipalitiesLayers()}
        </Source>

        {/* OpenSpace Layer - rendered before trails to ensure trails appear on top */}
        {showOpenSpace && (
          <OpenSpaceLayer
            showOpenSpace={showOpenSpace}
            showMunicipalityProfileMap={false}
            showRegionalTrailsProfile={true}
            mapRef={mapRef}
          />
        )}

        {/* Environmental Justice Layer - rendered before trails to ensure trails appear on top */}
        {showEnvironmentalJustice && (
          <EnvironmentalJusticeLayer
            showEnvironmentalJustice={showEnvironmentalJustice}
            showMunicipalityProfileMap={false}
            showRegionalTrailsProfile={true}
            mapRef={mapRef}
          />
        )}

        {/* Major Trails Layer - rendered after other layers to appear on top */}
        <MajorTrailsLayer
          showMajorTrails={selectedMajorTrails.length > 0}
          showRegionalTrailsProfile={true}
          mapRef={mapRef}
          selectedMajorTrails={selectedMajorTrails}
          onTrailsDataChange={setMajorTrailsData}
          hoveredTrail={
            hoveredTrail && (hoveredTrail.properties?.grouped_reg_name || hoveredTrail.isMajorTrail)
              ? hoveredTrail 
              : null
          }
          clickedTrail={majorTrailClickInfo ? {
            featureId: majorTrailClickInfo.feature.properties?.OBJECTID || 
                      majorTrailClickInfo.feature.properties?.objectid || 
                      majorTrailClickInfo.feature.id ||
                      null
          } : null}
        />

        {/* Trails Reg Name Sync Layer - rendered last to appear on top of all other layers */}
        <OtherRegionalTrailsLayer
          showTrailsRegNameSync={true}
          showMunicipalityProfileMap={false}
          showRegionalTrailsProfile={true}
          mapRef={mapRef}
          useColorCoding={false}
          onRegNamesChange={setRegNames}
          colorPalette={colorPalette}
          selectedRegNames={Array.from(selectedRegNames)}
          onTrailsDataChange={setAllTrailsData}
          hoveredTrail={hoveredTrail}
          clickedTrail={regularTrailClickInfo ? {
            featureId: regularTrailClickInfo.feature.properties?.OBJECTID || 
                      regularTrailClickInfo.feature.properties?.objectid || 
                      regularTrailClickInfo.feature.id ||
                      null
          } : null}
        />

        {/* No hover popup for regular trails - only show on click */}

        {/* Identify popup */}
        {showIdentifyPopup && identifyPoint && identifyInfo && identifyInfo.length > 0 && (
          <CommunityIdentify
            point={identifyPoint}
            identifyResult={identifyInfo}
            handleShowPopup={() => {
              toggleIdentifyPopup(false);
            }}
            handleCarousel={setPointIndex}
          />
        )}
        
        {/* Environmental Justice Click Popup */}
        {showEnvironmentalJustice && environmentalJusticeClickInfo && environmentalJusticeClickInfo.point && environmentalJusticeClickInfo.feature && (
          <Popup
            longitude={environmentalJusticeClickInfo.point.lng}
            latitude={environmentalJusticeClickInfo.point.lat}
            closeButton={true}
            onClose={() => setEnvironmentalJusticeClickInfo(null)}
            anchor="top"
            offset={12}
          >
            {(() => {
              const properties = environmentalJusticeClickInfo.feature.properties || {};
              
              return (
                <div style={{
                  minWidth: 200,
                  maxWidth: 300,
                  color: '#2774bd',
                  fontSize: '12px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontSize: '14px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>Environmental Justice</div>
                  {properties.GEOGRAPHICAREANAME && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Area:</strong> {properties.GEOGRAPHICAREANAME}</div>
                  )}
                  {properties.MUNICIPALITY && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Municipality:</strong> {properties.MUNICIPALITY}</div>
                  )}
                  {properties.EJ_CRIT_DESC && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>EJ Criteria:</strong> {properties.EJ_CRIT_DESC}</div>
                  )}
                  {properties.EJ && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>EJ Designated:</strong> {properties.EJ}</div>
                  )}
                  {properties.TOTAL_POP !== undefined && properties.TOTAL_POP !== null && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Total Population:</strong> {parseFloat(properties.TOTAL_POP).toLocaleString()}</div>
                  )}
                  {properties.PCT_MINORITY !== undefined && properties.PCT_MINORITY !== null && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Percent Minority:</strong> {parseFloat(properties.PCT_MINORITY).toFixed(1)}%</div>
                  )}
                  {properties.LIMENGHHPCT !== undefined && properties.LIMENGHHPCT !== null && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Limited English Households:</strong> {parseFloat(properties.LIMENGHHPCT).toFixed(1)}%</div>
                  )}
                  {properties.BG_MHHI !== undefined && properties.BG_MHHI !== null && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Median Household Income:</strong> ${parseFloat(properties.BG_MHHI).toLocaleString()}</div>
                  )}
                  {properties.GEOID && (
                    <div style={{marginBottom: '4px', fontSize: '11px', color: '#666', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>GEOID:</strong> {properties.GEOID}</div>
                  )}
                  {!properties.GEOGRAPHICAREANAME && !properties.MUNICIPALITY && !properties.EJ_CRIT_DESC && (
                    <div style={{wordWrap: 'break-word', overflowWrap: 'break-word'}}>No data available</div>
                  )}
                </div>
              );
            })()}
          </Popup>
        )}

        {/* Major Trail Click Popup */}
        {selectedMajorTrails && selectedMajorTrails.length > 0 && majorTrailClickInfo && majorTrailClickInfo.point && majorTrailClickInfo.feature && (
          <Popup
            longitude={majorTrailClickInfo.point.lng}
            latitude={majorTrailClickInfo.point.lat}
            closeButton={true}
            onClose={() => setMajorTrailClickInfo(null)}
            anchor="top"
            offset={12}
          >
            {(() => {
              const properties = majorTrailClickInfo.feature.properties || {};
              const segType = properties.seg_type;
              const facStat = properties.fac_stat;
              const trailTypeLabel = getTrailTypeLabel(segType, facStat);
              
              // Get municipality name
              const muniId = properties.muni_id || 
                            properties.MUNI_ID || 
                            properties.muniId || 
                            properties.MuniId ||
                            properties.municipality_id ||
                            properties.MUNICIPALITY_ID ||
                            null;
              const municipalityName = muniId ? getMunicipalityName(muniId) : null;
              
              return (
                <div style={{
                  minWidth: 200,
                  maxWidth: 300,
                  color: '#2774bd',
                  fontSize: '12px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  {/* Regional Trail Name */}
                  {properties.grouped_reg_name && (
                    <div style={{
                      fontWeight: 600,
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#2774bd',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {properties.grouped_reg_name}
                    </div>
                  )}
                  {trailTypeLabel && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>
                      <strong>Type:</strong> {trailTypeLabel}
                    </div>
                  )}
                  {municipalityName && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>
                      <strong>Municipality:</strong> {municipalityName}
                    </div>
                  )}
                  {properties.steward && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>
                      <strong>Steward:</strong> {properties.steward}
                    </div>
                  )}
                  {properties.website && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>
                      <strong>Website:</strong>{" "}
                      <a href={properties.website} target="_blank" rel="noopener noreferrer" style={{color: '#2774bd'}}>
                        {properties.website.length > 40 ? properties.website.substring(0, 40) + '...' : properties.website}
                      </a>
                    </div>
                  )}
                  {properties.length_ft && (
                    <div style={{marginBottom: '4px'}}>
                      <strong>Length:</strong> {(parseFloat(properties.length_ft) / 5280).toFixed(2)} miles
                    </div>
                  )}
                  {properties.fac_stat && (
                    <div style={{marginBottom: '4px'}}>
                      <strong>Status:</strong> {properties.fac_stat === 1 || properties.fac_stat === "1" ? "Existing" : properties.fac_stat === 2 || properties.fac_stat === "2" ? "Design/Construction" : "Envisioned"}
                    </div>
                  )}
                </div>
              );
            })()}
          </Popup>
        )}

        {/* Regular Trail Click Popup */}
        {regularTrailClickInfo && regularTrailClickInfo.point && regularTrailClickInfo.feature && (
          <Popup
            longitude={regularTrailClickInfo.point.lng}
            latitude={regularTrailClickInfo.point.lat}
            closeButton={true}
            onClose={() => setRegularTrailClickInfo(null)}
            anchor="top"
            offset={12}
          >
            {(() => {
              const properties = regularTrailClickInfo.feature.properties || {};
              const segType = properties.seg_type;
              const facStat = properties.fac_stat;
              const trailTypeLabel = getTrailTypeLabel(segType, facStat);
              
              // Get municipality name
              const muniId = properties.muni_id || 
                            properties.MUNI_ID || 
                            properties.muniId || 
                            properties.MuniId ||
                            properties.municipality_id ||
                            properties.MUNICIPALITY_ID ||
                            null;
              const municipalityName = muniId ? getMunicipalityName(muniId) : null;
              
              return (
                <div style={{
                  minWidth: 200,
                  maxWidth: 300,
                  color: '#2774bd',
                  fontSize: '12px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  {/* Regional Trail Name */}
                  {properties.reg_name && (
                    <div style={{
                      fontWeight: 600,
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#2774bd',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {properties.reg_name}
                    </div>
                  )}
                  {trailTypeLabel && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Type:</strong> {trailTypeLabel}</div>
                  )}
                  {municipalityName && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Municipality:</strong> {municipalityName}</div>
                  )}
                  {properties.steward && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}><strong>Steward:</strong> {properties.steward}</div>
                  )}
                  {properties.website && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>
                      <strong>Website:</strong>{" "}
                      <a href={properties.website} target="_blank" rel="noopener noreferrer" style={{color: '#2774bd', wordBreak: 'break-all'}}>
                        {properties.website.length > 40 ? properties.website.substring(0, 40) + '...' : properties.website}
                      </a>
                    </div>
                  )}
                  {properties.length_ft && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>
                      <strong>Length:</strong> {(parseFloat(properties.length_ft) / 5280).toFixed(2)} miles
                    </div>
                  )}
                  {properties.fac_stat && (
                    <div style={{marginBottom: '4px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>
                      <strong>Status:</strong> {properties.fac_stat === 1 || properties.fac_stat === "1" ? "Existing" : properties.fac_stat === 2 || properties.fac_stat === "2" ? "Design/Construction" : "Envisioned"}
                    </div>
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
            onClose={() => {
              setOpenSpaceClickInfo(null);
            }}
            anchor="top"
            offset={12}
          >
            {(() => {
              const properties = openSpaceClickInfo.feature.properties || {};
              
              return (
                <div style={{
                  minWidth: 200,
                  maxWidth: 300,
                  color: '#2774bd',
                  fontSize: '12px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: '6px',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>OpenSpace</div>
                  {properties.SITE_NAME && (
                    <div style={{marginBottom: '4px', fontWeight: 500, wordWrap: 'break-word', overflowWrap: 'break-word'}}>{properties.SITE_NAME}</div>
                  )}
                  {properties.FEE_OWNER && (
                    <div style={{marginBottom: '2px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>Owner: {properties.FEE_OWNER}</div>
                  )}
                  {properties.OWNER_TYPE && (
                    <div style={{marginBottom: '2px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>Owner Type: {properties.OWNER_TYPE}</div>
                  )}
                  {properties.PRIM_PURP && (
                    <div style={{marginBottom: '2px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>Primary Purpose: {properties.PRIM_PURP}</div>
                  )}
                  {properties.PUB_ACCESS && (
                    <div style={{marginBottom: '2px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>Public Access: {properties.PUB_ACCESS}</div>
                  )}
                  {properties.GIS_ACRES !== null && properties.GIS_ACRES !== undefined && (
                    <div style={{marginBottom: '2px', wordWrap: 'break-word', overflowWrap: 'break-word'}}>Acres: {parseFloat(properties.GIS_ACRES).toFixed(2)}</div>
                  )}
                  {!properties.SITE_NAME && !properties.FEE_OWNER && (
                    <div style={{wordWrap: 'break-word', overflowWrap: 'break-word'}}>No data available</div>
                  )}
                </div>
              );
            })()}
          </Popup>
        )}

        {/* Geocoder - styled to appear inside control panel */}
        <GeocoderPanel MAPBOX_TOKEN={MAPBOX_TOKEN} />

        {/* Map controls */}
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />
        <ScaleControl position="bottom-left" />
        
        {/* Trail Status Legend - only show when trails are selected */}
        {(selectedRegNames.size > 0 || selectedMajorTrails.length > 0) && (
          <div style={{
            position: 'absolute',
            bottom: '40px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            padding: '12px',
            zIndex: 1000,
            fontSize: '12px',
            minWidth: '180px'
          }}>
            <div style={{
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              fontWeight: 600,
              fontSize: '13px',
              color: '#333'
            }}>
              Trail Status
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Existing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px',
                  height: '3px',
                  backgroundColor: '#2774bd',
                  borderRadius: '2px',
                  flexShrink: 0
                }}></div>
                <span style={{ color: '#333' }}>Existing</span>
              </div>
              {/* Planned/Envisioned */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px',
                  height: '3px',
                  backgroundColor: '#6a1b9a',
                  borderRadius: '2px',
                  flexShrink: 0
                }}></div>
                <span style={{ color: '#333' }}>Planned/Envisioned/Design</span>
              </div>
              {/* Gap */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px',
                  height: '3px',
                  backgroundColor: '#FF0000',
                  borderRadius: '2px',
                  flexShrink: 0
                }}></div>
                <span style={{ color: '#333' }}>Gap</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Control Panel Toggle Button */}
        <Control
          style={"Map_filter d-block position-absolute m-0 p-0"}
          icon={FilterIcon}
          alt={"Show Control Panel"}
          clickHandler={() => toggleControlPanel(!showControlPanel)}
        />
      </ReactMapGL>


      {/* Basemap Panel */}
      {showBasemapPanel && (
        <BasemapPanel
          toggleBasemapPanel={toggleBasemapPanel}
        />
      )}

      {/* Control Panel */}
      {showControlPanel && (
        <div>
          <ControlPanel 
            selectedRegNames={selectedRegNames}
            selectedMajorTrails={selectedMajorTrails}
            onToggleRegName={(regName) => {
              const newSelected = new Set(selectedRegNames);
              if (newSelected.has(regName)) {
                newSelected.delete(regName);
              } else {
                newSelected.add(regName);
              }
              setSelectedRegNames(newSelected);
            }}
            onToggleMajorTrail={(majorTrailName) => {
              const newSelected = [...selectedMajorTrails];
              const index = newSelected.indexOf(majorTrailName);
              if (index > -1) {
                newSelected.splice(index, 1);
              } else {
                newSelected.push(majorTrailName);
              }
              setSelectedMajorTrails(newSelected);
            }}
          />
        </div>
      )}

      {/* Regional Trails Metrics Panel - separate window on the left */}
      <ProjectMetricsPanel 
        selectedRegNames={selectedRegNames}
        selectedMajorTrails={selectedMajorTrails}
        projectMetrics={projectMetrics}
        onZoomToProject={handleZoomToProject}
        allTrailsData={allTrailsData}
        majorTrailsData={majorTrailsData}
      />
    </div>
  );
};

export default RegionalTrailsProfile;

