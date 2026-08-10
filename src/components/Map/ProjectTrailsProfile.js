import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMapGL, { NavigationControl, GeolocateControl, ScaleControl, Popup, Source, Layer } from "react-map-gl";
import BasemapPanel from "../BasemapPanel";
import ControlPanelShell from "../ControlPanel/ControlPanelShell";
import RegionalTrailsControlPanel from "../ControlPanel/RegionalTrailsControlPanel";
import CommunityIdentify from "./tooltip/CommunityIdentify";
import GeocoderPanel from "../Geocoder/GeocoderPanel";
import { LayerContext } from "../../App";
import OtherRegionalTrailsLayer from "./layers/OtherRegionalTrailsLayer";
import MajorTrailsLayer from "./layers/MajorTrailsLayer";
import OpenSpaceLayer from "./layers/OpenSpaceLayer";
import EnvironmentalJusticeLayer from "./layers/EnvironmentalJusticeLayer";
import EnvironmentalJusticePopupContent from "./tooltip/EnvironmentalJusticePopupContent";
import OpenSpacePopupContent from "./tooltip/OpenSpacePopupContent";
import TrailPopupContent from "./tooltip/TrailPopupContent";
import massachusettsData from "../../data/massachusetts.json";
import { queryFeatureAtPoint } from "./utils/arcgisPointQuery";
import { getFeaturesAtPoint } from "./utils/mapQueryUtils";
import { EJ2020_MAP_SERVER_URL } from "./constants/trailFacilityTypeLabels";
import { MAJOR_TRAILS } from "../ControlPanel/regionalTrailConfig";
import { buildAllTrailMetrics } from "../../utils/regionalTrailMetrics";
import bbox from "@turf/bbox";

const legendBoxStyle = {
  position: "absolute",
  bottom: 40,
  right: 50,
  background: "rgba(255, 255, 255, 0.95)",
  border: "1px solid rgba(0, 0, 0, 0.1)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  borderRadius: 6,
  padding: 12,
  zIndex: 1000,
  fontSize: 12,
  minWidth: 180,
};

const TrailStatusLegend = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={legendBoxStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: isCollapsed ? 0 : 8,
          paddingBottom: isCollapsed ? 0 : 6,
          borderBottom: isCollapsed ? "none" : "1px solid rgba(0,0,0,0.1)",
          fontWeight: 600,
          fontSize: 13,
          color: "#333",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span>Trail Status</span>
        <button
          type="button"
          title={isCollapsed ? "Expand" : "Collapse"}
          aria-label={isCollapsed ? "Expand legend" : "Collapse legend"}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            fontSize: 11,
            color: "#666",
            cursor: "pointer",
            lineHeight: 1,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
        >
          {isCollapsed ? "▲" : "▼"}
        </button>
      </div>
      {!isCollapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { color: "#2774bd", label: "Existing" },
            { color: "#6a1b9a", label: "Planned/Envisioned/Design" },
            { color: "#FF0000", label: "Gap" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 3, backgroundColor: color, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ color: "#333" }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;

const INTERACTIVE_LAYER_IDS = [
  "major-trails-layer",
  "other-regional-trails-layer",
  "gaps-other-regional-trails-layer",
  "openspace-regional-layer",
  "openspace-regional-outline",
  "project-openspace-layer",
  "project-openspace-outline",
];

const ProjectTrailsProfile = ({ 
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
    showOpenSpace: showOpenSpaceFromContext,
    setShowOpenSpace: setShowOpenSpaceFromContext,
    showProjectOpenSpace,
    setShowProjectOpenSpace,
    showEnvironmentalJustice,
    setShowEnvironmentalJustice,
  } = useContext(LayerContext);

  const [showIdentifyPopup, toggleIdentifyPopup] = useState(false);
  const [identifyInfo, setIdentifyInfo] = useState(null);
  const [identifyPoint, setIdentifyPoint] = useState(null);
  const [pointIndex, setPointIndex] = useState(0);
  const [regNames, setRegNames] = useState([]);
  const [selectedRegNames, setSelectedRegNames] = useState(new Set()); // Track selected projects (Set for easy toggle)
  const selectedRegNamesArray = useMemo(
    () => Array.from(selectedRegNames),
    [selectedRegNames]
  );
  const [selectedMajorTrails, setSelectedMajorTrails] = useState([]); // Track selected major trails (array of grouped_reg_name values)
  const [detailTrail, setDetailTrail] = useState(null);
  const [hoveredTrail, setHoveredTrail] = useState(null);
  const allRegNamesRef = useRef(new Set()); // Track all unique reg_names seen using ref
  const [allTrailsData, setAllTrailsData] = useState(null); // Store all trail data from OtherRegionalTrailsLayer
  const [majorTrailsData, setMajorTrailsData] = useState(null); // Store all major trail data from MajorTrailsLayer
  
  // Use global OpenSpace state instead of local state to persist across profile switches
  const showOpenSpace = showOpenSpaceFromContext;
  const isAnyOpenSpaceVisible = showOpenSpace || showProjectOpenSpace;
  
  const [openSpaceHoverInfo, setOpenSpaceHoverInfo] = useState(null);

  const isOpenSpaceLayerId = (layerId) =>
    layerId === "openspace-regional-layer" ||
    layerId === "openspace-regional-outline" ||
    layerId === "project-openspace-layer" ||
    layerId === "project-openspace-outline";

  const getOpenSpaceInteractiveLayerIds = () => {
    const ids = [];
    if (showOpenSpace) {
      ids.push("openspace-regional-layer", "openspace-regional-outline");
    }
    if (showProjectOpenSpace) {
      ids.push("project-openspace-layer", "project-openspace-outline");
    }
    return ids;
  };  
  // Listen for map context layer toggle events (Trails Profiles)
  useEffect(() => {
    const handleToggleOpenSpace = (event) => {
      if (location.pathname === '/projectTrailsProfile') {
        setShowOpenSpaceFromContext(event.detail.show);
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

    const handleToggleEnvironmentalJustice = (event) => {
      if (location.pathname === '/projectTrailsProfile') {
        setShowEnvironmentalJustice(event.detail.show);
      }
    };

    const handleToggleProjectOpenSpace = (event) => {
      if (location.pathname === "/projectTrailsProfile") {
        setShowProjectOpenSpace(event.detail.show);
        if (event.detail.show && mapRef?.current) {
          const map = mapRef.current.getMap();
          if (map && map.getZoom() < 11) {
            map.easeTo({
              zoom: 11,
              duration: 1000,
            });
          }
        }
      }
    };

    window.addEventListener('toggleOpenSpace', handleToggleOpenSpace);
    window.addEventListener('toggleProjectOpenSpace', handleToggleProjectOpenSpace);
    window.addEventListener(
      'toggleEnvironmentalJustice',
      handleToggleEnvironmentalJustice
    );
    return () => {
      window.removeEventListener('toggleOpenSpace', handleToggleOpenSpace);
      window.removeEventListener('toggleProjectOpenSpace', handleToggleProjectOpenSpace);
      window.removeEventListener(
        'toggleEnvironmentalJustice',
        handleToggleEnvironmentalJustice
      );
    };
  }, [location.pathname, setShowOpenSpaceFromContext, setShowProjectOpenSpace, setShowEnvironmentalJustice, mapRef]);

  const [environmentalJusticeClickInfo, setEnvironmentalJusticeClickInfo] = useState(null); // Store Environmental Justice click info for popup
  const [majorTrailClickInfo, setMajorTrailClickInfo] = useState(null); // Store Major Trail click info for popup
  const [regularTrailClickInfo, setRegularTrailClickInfo] = useState(null); // Store Regular Trail click info for popup
  const ejHoverTimeoutRef = useRef(null);
  const ejHoverQueryIdRef = useRef(0);

  useEffect(() => {
    const handleResetRegionalProfile = () => {
      setSelectedRegNames(new Set());
      setSelectedMajorTrails([]);
      setDetailTrail(null);
      setShowProjectOpenSpace(false);
      setHoveredTrail(null);
      setOpenSpaceHoverInfo(null);
      setEnvironmentalJusticeClickInfo(null);
      setMajorTrailClickInfo(null);
      setRegularTrailClickInfo(null);
      toggleIdentifyPopup(false);
      setIdentifyInfo(null);
      setIdentifyPoint(null);
      allRegNamesRef.current = new Set();
    };

    window.addEventListener("resetRegionalProfile", handleResetRegionalProfile);
    return () => {
      window.removeEventListener("resetRegionalProfile", handleResetRegionalProfile);
    };
  }, [toggleIdentifyPopup]);

  // Update reg_names in context when discovered
  useEffect(() => {
    if (regNames.length > 0) {
      const previousSize = allRegNamesRef.current.size;
      regNames.forEach(name => {
        if (name && name.trim() !== "") {
          allRegNamesRef.current.add(name);
        }
      });

      if (allRegNamesRef.current.size !== previousSize) {
        const sortedRegNames = Array.from(allRegNamesRef.current).sort();
        if (setProjectRegNames) setProjectRegNames(sortedRegNames);
      } else if (setProjectRegNames) {
        setProjectRegNames(regNames);
      }
    }
  }, [regNames, setProjectRegNames]);

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
      return false;
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
      return false;
    }

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
            padding: { top: 100, bottom: 100, left: 500, right: 80 },
            duration: 1000,
            maxZoom: 12
          }
        );
      return true;
    } catch (e) {
      console.warn("Error fitting bounds to project trails:", e);
      return false;
    }
  };

  // Zoom to trail when user checks a regional trail (other projects or major trails)
  const previousSelectedRef = useRef(new Set());
  const previousMajorTrailsRef = useRef([]);

  useEffect(() => {
    // Zoom when a new "other regional trail" project is selected
    const newlySelected = Array.from(selectedRegNames).filter(
      regName => !previousSelectedRef.current.has(regName)
    );
    if (newlySelected.length > 0) {
      const zoomed = handleZoomToProject(newlySelected[0]);
      if (zoomed) {
        previousSelectedRef.current = new Set(selectedRegNames);
      }
    } else {
      previousSelectedRef.current = new Set(selectedRegNames);
    }
  }, [selectedRegNames, allTrailsData]);

  useEffect(() => {
    // Zoom when a new major trail is selected
    const newlySelected = selectedMajorTrails.filter(
      name => !previousMajorTrailsRef.current.includes(name)
    );
    if (newlySelected.length > 0) {
      const zoomed = handleZoomToProject(newlySelected[0]);
      if (zoomed) {
        previousMajorTrailsRef.current = [...selectedMajorTrails];
      }
    } else {
      previousMajorTrailsRef.current = [...selectedMajorTrails];
    }
  }, [selectedMajorTrails, majorTrailsData]);

  // Query Environmental Justice feature at a point
  const queryEnvironmentalJusticeAtPoint = (lng, lat) =>
    queryFeatureAtPoint(`${EJ2020_MAP_SERVER_URL}/0`, lng, lat);

  const clearAllPopups = () => {
    toggleIdentifyPopup(false);
    setOpenSpaceHoverInfo(null);
    setEnvironmentalJusticeClickInfo(null);
    setMajorTrailClickInfo(null);
    setRegularTrailClickInfo(null);
  };

  const showPopup = (setter, data) => {
    clearAllPopups();
    setTimeout(() => setter(data), 10);
  };

  const pt = (e) => ({ lng: e.lngLat.lng, lat: e.lngLat.lat });

  /**
   * Handle map click: show popup for trail/EJ features or clear all.
   * Open space is hover-only — no click tooltip.
   */
  const handleTrailClick = async (event) => {
    const map = mapRef.current?.getMap();
    if (!map || !event.lngLat) {
      clearAllPopups();
      return;
    }

    // 1. Major trails (vector)
    if (selectedMajorTrails?.length) {
      const feature = getFeaturesAtPoint(map, event, ["major-trails-layer"]);
      if (feature) {
        setOpenSpaceHoverInfo(null);
        showPopup(setMajorTrailClickInfo, { point: pt(event), feature });
        return;
      }
    }

    // 2. Regular trails (vector)
    const trailFeatures = getFeaturesAtPoint(
      map,
      event,
      ["other-regional-trails-layer", "gaps-other-regional-trails-layer"],
      { returnAll: true }
    );
    if (trailFeatures.length) {
      setOpenSpaceHoverInfo(null);
      showPopup(setRegularTrailClickInfo, {
        point: pt(event),
        feature: trailFeatures[0],
      });
      return;
    }

    // 3. Open space — hover only; ignore click so hover tooltip can remain
    if (isAnyOpenSpaceVisible) {
      const feature = getFeaturesAtPoint(
        map,
        event,
        getOpenSpaceInteractiveLayerIds()
      );
      if (feature) {
        return;
      }
    }

    // 4. EJ (raster - query server)
    if (showEnvironmentalJustice) {
      const ejFeature = await queryEnvironmentalJusticeAtPoint(
        event.lngLat.lng,
        event.lngLat.lat
      );
      if (ejFeature) {
        const isSame =
          environmentalJusticeClickInfo?.feature?.properties?.OBJECTID ===
          ejFeature.properties?.OBJECTID;
        if (isSame) setEnvironmentalJusticeClickInfo(null);
        else
          showPopup(setEnvironmentalJusticeClickInfo, {
            point: pt(event),
            feature: ejFeature,
          });
        return;
      }
    }

    clearAllPopups();
  };

  /**
   * Handle map hover: set hoveredTrail to control cursor (pointer when over clickable features)
   * and layer hover highlights (thicker line on trails).
   *
   * Flow:
   * - Vector layers (trails, OpenSpace): use queryRenderedFeatures - any feature from
   *   INTERACTIVE_LAYER_IDS = pointer. MajorTrailsLayer/OtherRegionalTrailsLayer need
   *   featureId in hoveredTrail for their hover highlight.
   * - EJ layer (raster): no vector data on client - debounced point query to server.
   */
  const handleTrailHover = (event) => {
    const map = mapRef.current?.getMap();
    if (!map || !event.lngLat) {
      setHoveredTrail(null);
      setOpenSpaceHoverInfo(null);
      return;
    }

    let features = event.features;
    if (!features) {
      try {
        features = map.queryRenderedFeatures(event.point);
      } catch (err) {
        setHoveredTrail(null);
        setOpenSpaceHoverInfo(null);
        return;
      }
    }

    // Prefer trail hover over open space (trails render above open space)
    const trailFeature = features.find((f) => {
      const layerId = f.layer?.id;
      return (
        layerId === "major-trails-layer" ||
        layerId === "other-regional-trails-layer" ||
        layerId === "gaps-other-regional-trails-layer"
      );
    });

    if (trailFeature) {
      setOpenSpaceHoverInfo(null);
      const layerId = trailFeature.layer.id;
      if (layerId === "major-trails-layer") {
        setHoveredTrail({
          properties: trailFeature.properties,
          lngLat: event.lngLat,
          featureId: trailFeature.properties?.OBJECTID ?? null,
          isMajorTrail: true,
        });
      } else {
        setHoveredTrail({
          properties: trailFeature.properties,
          lngLat: event.lngLat,
          featureId: trailFeature.properties?.OBJECTID ?? null,
          isRegularTrail: true,
        });
      }
      return;
    }

    if (isAnyOpenSpaceVisible) {
      const openSpaceLayerIds = getOpenSpaceInteractiveLayerIds().filter(
        (id) => map.getLayer(id)
      );
      let openSpaceFeature = features.find(
        (f) => f.layer?.id && isOpenSpaceLayerId(f.layer.id)
      );

      if (!openSpaceFeature && openSpaceLayerIds.length > 0) {
        try {
          const queried = map.queryRenderedFeatures(event.point, {
            layers: openSpaceLayerIds,
          });
          openSpaceFeature =
            queried.find((f) => f.layer.id.endsWith("-layer")) || queried[0];
        } catch (err) {
          openSpaceFeature = null;
        }
      }

      if (openSpaceFeature) {
        setHoveredTrail({ isOpenSpace: true });
        setOpenSpaceHoverInfo({
          point: event.lngLat,
          feature: openSpaceFeature,
        });
        return;
      }
    }

    setOpenSpaceHoverInfo(null);

    // EJ: raster layer - must query server (no vector data on client)
    if (showEnvironmentalJustice) {
      if (ejHoverTimeoutRef.current) clearTimeout(ejHoverTimeoutRef.current);
      const queryId = ++ejHoverQueryIdRef.current;
      ejHoverTimeoutRef.current = setTimeout(() => {
        queryEnvironmentalJusticeAtPoint(event.lngLat.lng, event.lngLat.lat).then((ejFeature) => {
          if (queryId !== ejHoverQueryIdRef.current) return;
          setHoveredTrail(ejFeature ? { isEnvironmentalJustice: true } : null);
        });
      }, 150);
      return;
    }

    if (ejHoverTimeoutRef.current) {
      clearTimeout(ejHoverTimeoutRef.current);
      ejHoverTimeoutRef.current = null;
    }
    setHoveredTrail(null);
  };

  const allTrailMetrics = useMemo(
    () =>
      buildAllTrailMetrics({
        majorTrailNames: MAJOR_TRAILS,
        otherTrailNames: regNames,
        majorTrailsData,
        allTrailsData,
      }),
    [regNames, majorTrailsData, allTrailsData]
  );

  const projectOpenSpaceTownIds = useMemo(() => {
    const idSet = new Set();

    if (detailTrail) {
      const metrics = allTrailMetrics[detailTrail.name] || {};
      (metrics.municipalityIds || []).forEach((id) => idSet.add(String(id)));
    } else {
      selectedMajorTrails.forEach((name) => {
        (allTrailMetrics[name]?.municipalityIds || []).forEach((id) =>
          idSet.add(String(id))
        );
      });
      selectedRegNamesArray.forEach((name) => {
        (allTrailMetrics[name]?.municipalityIds || []).forEach((id) =>
          idSet.add(String(id))
        );
      });
    }

    if (idSet.size === 0) return null;

    return Array.from(idSet)
      .sort((a, b) => Number(a) - Number(b))
      .join(",");
  }, [
    detailTrail,
    allTrailMetrics,
    selectedMajorTrails,
    selectedRegNamesArray,
  ]);

  const detailOpenSpaceTownIds = useMemo(() => {
    if (!detailTrail) return null;
    const metrics = allTrailMetrics[detailTrail.name] || {};
    const ids = metrics.municipalityIds || [];
    return ids.length ? ids.join(",") : null;
  }, [detailTrail, allTrailMetrics]);

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
      layerIds.push("openspace-regional-layer");
      layerIds.push("openspace-regional-outline");
    }
    if (showProjectOpenSpace) {
      layerIds.push("project-openspace-layer");
      layerIds.push("project-openspace-outline");
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
  }, [mapRef, selectedRegNames, selectedMajorTrails, showOpenSpace, showProjectOpenSpace, showEnvironmentalJustice]);

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
        cursor={hoveredTrail ? "pointer" : "default"}
        interactiveLayerIds={getTrailLayerIds()}
        onMove={(event) => {
          setViewport(event.viewState);
        }}
        onClick={handleTrailClick}
        onMouseMove={handleTrailHover}
        onMouseLeave={() => {
          if (ejHoverTimeoutRef.current) {
            clearTimeout(ejHoverTimeoutRef.current);
            ejHoverTimeoutRef.current = null;
          }
          setHoveredTrail(null);
          setOpenSpaceHoverInfo(null);
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={baseLayer.url}
        scrollZoom={true}
        transitionDuration="1000"
        transformRequest={(url, resourceType) => {
          // Only transform non-Mapbox tile requests (e.g. ArcGIS VectorTileServer)
          if (resourceType === 'Tile' && !url.includes('mapbox.com') && url.includes('VectorTileServer/tile/')) {
            const convertedUrl = url.replace(/\/tile\/(\d+)\/(\d+)\/(\d+)\.pbf/, (match, z, y, x) => {
              return `/tile/${z}/${x}/${y}.pbf`;
            });
            return { url: convertedUrl };
          }
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
            showProjectTrailsProfile={true}
            mapRef={mapRef}
            townId={projectOpenSpaceTownIds}
            idPrefix="openspace-regional"
            beforeId={
              selectedRegNames.size > 0
                ? "other-regional-trails-layer"
                : selectedMajorTrails.length > 0
                  ? "major-trails-layer"
                  : undefined
            }
          />
        )}

        {showProjectOpenSpace && detailOpenSpaceTownIds && (
          <OpenSpaceLayer
            showOpenSpace={showProjectOpenSpace}
            showMunicipalityProfileMap={false}
            showProjectTrailsProfile={true}
            mapRef={mapRef}
            townId={detailOpenSpaceTownIds}
            idPrefix="project-openspace"
            beforeId={
              selectedRegNames.size > 0
                ? "other-regional-trails-layer"
                : selectedMajorTrails.length > 0
                  ? "major-trails-layer"
                  : undefined
            }
          />
        )}

        {/* Environmental Justice Layer - rendered before trails to ensure trails appear on top */}
        {showEnvironmentalJustice && (
          <EnvironmentalJusticeLayer
            showEnvironmentalJustice={showEnvironmentalJustice}
            showMunicipalityProfileMap={false}
            showProjectTrailsProfile={true}
            mapRef={mapRef}
          />
        )}

        {/* Major Trails Layer - rendered after other layers to appear on top */}
        <MajorTrailsLayer
          showMajorTrails={selectedMajorTrails.length > 0}
          showProjectTrailsProfile={true}
          mapRef={mapRef}
          selectedMajorTrails={selectedMajorTrails}
          onTrailsDataChange={setMajorTrailsData}
          hoveredTrail={
            hoveredTrail && (hoveredTrail.properties?.grouped_reg_name || hoveredTrail.isMajorTrail)
              ? hoveredTrail 
              : null
          }
          clickedTrail={majorTrailClickInfo ? {
            featureId: majorTrailClickInfo.feature.properties?.OBJECTID 
          } : null}
        />

        {/* other regional trails layer - rendered last to appear on top of all other layers */}
        <OtherRegionalTrailsLayer
          showTrailsRegNameSync={true}
          showMunicipalityProfileMap={false}
          showProjectTrailsProfile={true}
          mapRef={mapRef}
          useColorCoding={false}
          onRegNamesChange={setRegNames}
          selectedRegNames={selectedRegNamesArray}
          onTrailsDataChange={setAllTrailsData}
          hoveredTrail={hoveredTrail}
          clickedTrail={regularTrailClickInfo ? {
           featureId: regularTrailClickInfo.feature.properties?.OBJECTID } : null}
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
            <TrailPopupContent
              properties={majorTrailClickInfo.feature.properties}
              titleKey="grouped_reg_name"
            />
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
            <TrailPopupContent
              properties={regularTrailClickInfo.feature.properties}
              titleKey="reg_name"
            />
          </Popup>
        )}

        {/* OpenSpace Hover Tooltip (hover only — no click popup) */}
        {isAnyOpenSpaceVisible &&
          openSpaceHoverInfo?.point &&
          openSpaceHoverInfo?.feature && (
            <Popup
              longitude={openSpaceHoverInfo.point.lng}
              latitude={openSpaceHoverInfo.point.lat}
              closeButton={false}
              closeOnMove={true}
              anchor="top"
              offset={12}
            >
              <OpenSpacePopupContent
                properties={openSpaceHoverInfo.feature.properties}
              />
            </Popup>
          )}

        {/* Map controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />
        <ScaleControl position="bottom-left" />
        
        {/* Trail Status Legend - only show when trails are selected */}
        {(selectedRegNames.size > 0 || selectedMajorTrails.length > 0) && (
          <TrailStatusLegend />
        )}
      </ReactMapGL>


      {/* Basemap Panel */}
      {showBasemapPanel && (
        <BasemapPanel
          toggleBasemapPanel={toggleBasemapPanel}
        />
      )}

      <ControlPanelShell
        showControlPanel={showControlPanel}
        toggleControlPanel={toggleControlPanel}
      >
        <RegionalTrailsControlPanel
          regNames={regNames}
          selectedRegNames={selectedRegNames}
          onToggleRegName={(regName) => {
            const newSelected = new Set(selectedRegNames);
            if (newSelected.has(regName)) {
              newSelected.delete(regName);
            } else {
              newSelected.add(regName);
            }
            setSelectedRegNames(newSelected);
          }}
          selectedMajorTrails={selectedMajorTrails}
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
          allTrailMetrics={allTrailMetrics}
          detailTrail={detailTrail}
          onOpenDetail={setDetailTrail}
          onCloseDetail={() => setDetailTrail(null)}
          onClearAll={() => {
            setSelectedRegNames(new Set());
            setSelectedMajorTrails([]);
            setDetailTrail(null);
          }}
          onZoomToProject={handleZoomToProject}
          allTrailsData={allTrailsData}
          majorTrailsData={majorTrailsData}
        />
      </ControlPanelShell>
    </div>
  );
};

export default ProjectTrailsProfile;

