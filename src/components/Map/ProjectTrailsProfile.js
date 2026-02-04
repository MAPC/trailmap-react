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
import TrailsRegNameSyncLayer from "./layers/TrailsRegNameSyncLayer";
import OpenSpaceLayer from "./layers/OpenSpaceLayer";
import EnvironmentalJusticeLayer from "./layers/EnvironmentalJusticeLayer";
import massachusettsData from "../../data/massachusetts.json";
import * as turf from "@turf/turf";
import bbox from "@turf/bbox";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;

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
    setProjectColorPalette,
    showMunicipalities,
    toggleMunicipalities,
    showOpenSpace,
    setShowOpenSpace,
    showEnvironmentalJustice,
    setShowEnvironmentalJustice,
  } = useContext(LayerContext);

  const [showIdentifyPopup, toggleIdentifyPopup] = useState(false);
  const [identifyInfo, setIdentifyInfo] = useState(null);
  const [identifyPoint, setIdentifyPoint] = useState(null);
  const [pointIndex, setPointIndex] = useState(0);
  const [regNames, setRegNames] = useState([]);
  const [selectedRegNames, setSelectedRegNames] = useState(new Set()); // Track selected projects (Set for easy toggle)

  // Reset selected projects when entering Project Trails Profile and show municipalities by default
  useEffect(() => {
    if (location.pathname === '/projectTrailsProfile') {
      setSelectedRegNames(new Set());
      // Show municipalities by default
      toggleMunicipalities(true);
    }
  }, [location.pathname, toggleMunicipalities]);
  const [hoveredTrail, setHoveredTrail] = useState(null);
  const [colorPalette, setColorPalette] = useState({});
  const allRegNamesRef = useRef(new Set()); // Track all unique reg_names seen using ref
  const [allTrailsData, setAllTrailsData] = useState(null); // Store all trail data from TrailsRegNameSyncLayer
  const [openSpaceData, setOpenSpaceData] = useState(null); // Store OpenSpace data for park intersection calculations
  const [openSpaceClickInfo, setOpenSpaceClickInfo] = useState(null); // Store OpenSpace click info for popup

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

  // Handle trail click
  const handleTrailClick = async (event) => {
    const map = mapRef.current?.getMap();
    if (!map || !event.lngLat) {
      toggleIdentifyPopup(false);
      setOpenSpaceClickInfo(null);
      return;
    }

    // Check for OpenSpace clicks first
    if (showOpenSpace && event.features) {
      const openSpaceFeature = event.features.find((f) => 
        f.layer && (f.layer.id === 'openspace-layer' || f.layer.id === 'openspace-outline')
      );
      
      if (openSpaceFeature) {
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
        toggleIdentifyPopup(false);
        return;
      }
    }

    let trailFeatures = [];

    // First, try to get features from event.features
    if (event.features && event.features.length > 0) {
      trailFeatures = event.features.filter((f) => 
        f.layer && (f.layer.id === "trails-reg-name-sync-layer" || f.layer.id === "gaps-reg-name-sync-layer")
      );
    }

    // If no features found, query the map directly
    if (trailFeatures.length === 0) {
      const point = [event.lngLat.lng, event.lngLat.lat];
      // Query all rendered features at the click point
      const allFeatures = map.queryRenderedFeatures(point);
      
      // Filter for trail layers (including gaps)
      trailFeatures = allFeatures.filter((f) => 
        f.layer && (f.layer.id === "trails-reg-name-sync-layer" || f.layer.id === "gaps-reg-name-sync-layer")
      );
    }

    if (trailFeatures.length > 0) {
      const trailResults = trailFeatures.map(feature => {
        const props = feature.properties || {};
        const segType = props.seg_type;
        const facStat = props.fac_stat;
        const trailTypeLabel = getTrailTypeLabel(segType, facStat);
        
        return {
          layerName: trailTypeLabel,
          attributes: props
        };
      });

      if (trailResults.length > 0) {
        const popupCoords = { lng: event.lngLat.lng, lat: event.lngLat.lat };

        toggleIdentifyPopup(false);
        setOpenSpaceClickInfo(null);
        setTimeout(() => {
          setIdentifyPoint(popupCoords);
          setIdentifyInfo(trailResults);
          setPointIndex(0);
          toggleIdentifyPopup(true);
        }, 10);
      }
    } else {
      // If clicking on empty space, close popups
      toggleIdentifyPopup(false);
      if (showOpenSpace) {
        const point = [event.lngLat.lng, event.lngLat.lat];
        const queriedFeatures = map.queryRenderedFeatures(point, {
          layers: ['openspace-layer', 'openspace-outline']
        });
        if (queriedFeatures.length === 0) {
          setOpenSpaceClickInfo(null);
        }
      }
    }
  };

  // Handle trail hover
  const handleTrailHover = (event) => {
    const map = mapRef.current?.getMap();
    if (!map || !event.lngLat) {
      setHoveredTrail(null);
      return;
    }

    const point = [event.lngLat.lng, event.lngLat.lat];
    const features = event.features || map.queryRenderedFeatures(point);

    // Handle trail hover (including gaps)
    const trailFeature = features.find((f) => 
      f.layer && (f.layer.id === "trails-reg-name-sync-layer" || f.layer.id === "gaps-reg-name-sync-layer")
    );

    if (trailFeature) {
      setHoveredTrail({
        properties: trailFeature.properties,
        lngLat: event.lngLat,
        featureId: trailFeature.properties?.OBJECTID || 
                  trailFeature.properties?.objectid || 
                  trailFeature.id ||
                  null
      });
      return;
    }

    // No municipality hover handling - municipalities are always visible but not interactive
    setHoveredTrail(null);
  };

  // Calculate metrics for selected projects
  const projectMetrics = useMemo(() => {
    if (!allTrailsData || !allTrailsData.features || selectedRegNames.size === 0) {
      return {};
    }

    const metrics = {};
    
    // Process each selected project
    Array.from(selectedRegNames).forEach(regName => {
      // Filter trails for this project
      const projectTrails = allTrailsData.features.filter(
        feature => (feature.properties?.reg_name || "").trim() === regName.trim()
      );

      if (projectTrails.length === 0) {
        metrics[regName] = {
          totalLength: 0,
          totalLengthMiles: 0,
          municipalities: []
        };
        return;
      }

      // Calculate total length and categorize by status and type
      let totalLengthFeet = 0;
      let completedLengthFeet = 0; // fac_stat = 1 means existing/completed
      const lengthByType = {}; // Track length by trail type
      const gaps = []; // Track gaps (seg_type = 9)
      
      projectTrails.forEach(trail => {
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
        
        // Track length by type
        if (!lengthByType[trailTypeLabel]) {
          lengthByType[trailTypeLabel] = 0;
        }
        lengthByType[trailTypeLabel] += lengthFeet;
        
        // Track gaps (seg_type = 9)
        if (segType === 9 || segType === "9") {
          gaps.push({
            type: trailTypeLabel,
            length: lengthFeet,
            geometry: trail.geometry
          });
        }
      });

      const totalLengthMiles = totalLengthFeet / 5280;
      const completedLengthMiles = completedLengthFeet / 5280;
      const percentageComplete = totalLengthFeet > 0 
        ? ((completedLengthFeet / totalLengthFeet) * 100).toFixed(1)
        : 0;

      // Determine which municipalities the trails are in
      const municipalitySet = new Set();
      
      if (massachusettsData && massachusettsData.features) {
        projectTrails.forEach(trail => {
          if (trail.geometry) {
            try {
              const trailFeature = turf.feature(trail.geometry);
              
              massachusettsData.features.forEach(muni => {
                if (muni.geometry) {
                  try {
                    const muniPolygon = turf.feature(muni.geometry);
                    const intersects = turf.booleanIntersects(trailFeature, muniPolygon);
                    
                    if (intersects) {
                      const muniName = muni.properties?.town || muni.properties?.NAME || null;
                      if (muniName) {
                        municipalitySet.add(muniName);
                      }
                    }
                  } catch (e) {
                    // Skip if geometry is invalid
                  }
                }
              });
            } catch (e) {
              // Skip if trail geometry is invalid
            }
          }
        });
      }

      // Find parks (OpenSpace) that trails pass through
      const parksSet = new Set();
      if (openSpaceData && openSpaceData.features) {
        projectTrails.forEach(trail => {
          if (trail.geometry) {
            try {
              const trailFeature = turf.feature(trail.geometry);
              
              openSpaceData.features.forEach(park => {
                if (park.geometry) {
                  try {
                    const parkPolygon = turf.feature(park.geometry);
                    const intersects = turf.booleanIntersects(trailFeature, parkPolygon);
                    
                    if (intersects) {
                      const parkName = park.properties?.SITE_NAME || 
                                      park.properties?.NAME || 
                                      park.properties?.name ||
                                      "Unnamed Park";
                      parksSet.add(parkName);
                    }
                  } catch (e) {
                    // Skip if geometry is invalid
                  }
                }
              });
            } catch (e) {
              // Skip if trail geometry is invalid
            }
          }
        });
      }

      // Get trail steward and website from first trail (assuming they're consistent for a project)
      const firstTrail = projectTrails[0];
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

      // Convert lengthByType to array with miles
      const lengthByTypeArray = Object.entries(lengthByType).map(([type, feet]) => ({
        type,
        miles: (feet / 5280).toFixed(2)
      }));

      metrics[regName] = {
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
    });

    return metrics;
  }, [allTrailsData, selectedRegNames, openSpaceData]);


  // Get all layer IDs for trails reg name sync (only selected projects)
  const getTrailLayerIds = () => {
    const layerIds = [];
    if (selectedRegNames.size > 0) {
      // Add regular trail layer
      layerIds.push("trails-reg-name-sync-layer");
      // Add gap layer
      layerIds.push("gaps-reg-name-sync-layer");
    }
    // Add OpenSpace layers if OpenSpace is shown
    if (showOpenSpace) {
      layerIds.push("openspace-layer");
      layerIds.push("openspace-outline");
    }
    // Don't add municipalities-fill to interactive layers since we don't want hover
    return layerIds;
  };

  // Municipality layers function - always show, no hover
  const municipalitiesLayers = () => {
    const visibleMunicipalitiesLayers = [];
    // Always show municipalities in project trails profile
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

  // Ensure baseLayer and MAPBOX_TOKEN exist before rendering
  if (!baseLayer || !baseLayer.url || !MAPBOX_TOKEN) {
    return null;
  }

  return (
    <div className="project-trails-profile-map" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <ReactMapGL
        ref={mapRef}
        {...viewport}
        width="100%"
        height="100%"
        cursor="default"
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
      >
        {/* Trails Reg Name Sync Layer */}
        <TrailsRegNameSyncLayer
          showTrailsRegNameSync={true}
          showMunicipalityProfileMap={false}
          showProjectTrailsProfile={true}
          mapRef={mapRef}
          useColorCoding={false}
          onRegNamesChange={setRegNames}
          colorPalette={colorPalette}
          selectedRegNames={Array.from(selectedRegNames)}
          onTrailsDataChange={setAllTrailsData}
          hoveredTrail={hoveredTrail}
        />

        {/* Hover popup */}
        {hoveredTrail && hoveredTrail.lngLat && (
          <Popup
            longitude={hoveredTrail.lngLat.lng}
            latitude={hoveredTrail.lngLat.lat}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={[0, -10]}
          >
            <div style={{ fontSize: '12px', maxWidth: '200px' }}>
              <strong>{hoveredTrail.properties?.reg_name || 'Unknown Project'}</strong>
            </div>
          </Popup>
        )}

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

        {/* Municipality Map Layer - always visible */}
        <Source 
          id="municipalities" 
          type="geojson" 
          data={massachusettsData}
        >
          {municipalitiesLayers()}
        </Source>

        {/* OpenSpace Layer */}
        {showOpenSpace && (
          <OpenSpaceLayer
            showOpenSpace={showOpenSpace}
            showMunicipalityProfileMap={false}
            showProjectTrailsProfile={true}
            mapRef={mapRef}
            onDataChange={setOpenSpaceData}
          />
        )}

        {/* Environmental Justice Layer */}
        {showEnvironmentalJustice && (
          <EnvironmentalJusticeLayer
            showEnvironmentalJustice={showEnvironmentalJustice}
            showMunicipalityProfileMap={false}
            showProjectTrailsProfile={true}
            mapRef={mapRef}
          />
        )}

        {/* Geocoder - styled to appear inside control panel */}
        <GeocoderPanel MAPBOX_TOKEN={MAPBOX_TOKEN} />

        {/* Map controls */}
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />
        <ScaleControl position="bottom-left" />
        
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
            onToggleRegName={(regName) => {
              const newSelected = new Set(selectedRegNames);
              if (newSelected.has(regName)) {
                newSelected.delete(regName);
              } else {
                newSelected.add(regName);
              }
              setSelectedRegNames(newSelected);
            }}
          />
        </div>
      )}

      {/* Project Metrics Panel - separate window on the left */}
      <ProjectMetricsPanel 
        selectedRegNames={selectedRegNames}
        projectMetrics={projectMetrics}
      />
    </div>
  );
};

export default ProjectTrailsProfile;

