import React, { useEffect, useState, useRef, useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import { ARCGIS_TOKEN, withArcGisToken } from "../constants/arcgisConfig";

const extractRegNamesFromFeatures = (features = []) => {
  const regNames = new Set();
  features.forEach((feature) => {
    const regName =
      feature.properties?.reg_name ?? feature.attributes?.reg_name;
    if (regName && String(regName).trim() !== "") {
      regNames.add(String(regName).trim());
    }
  });
  return Array.from(regNames).sort();
};

/**
 * Generates a color palette for different reg_name values
 * Returns a consistent color for each unique reg_name
 */
const generateColorPalette = (regNames) => {
  const colors = [
    "#FF6B35", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
    "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52BE80",
    "#EC7063", "#5DADE2", "#F1948A", "#58D68D", "#F4D03F",
    "#AF7AC5", "#7FB3D3", "#F5B041", "#82E0AA", "#F39C12",
    "#E74C3C", "#3498DB", "#E67E22", "#1ABC9C", "#9B59B6",
    "#34495E", "#16A085", "#27AE60", "#2980B9", "#8E44AD"
  ];
  
  const palette = {};
  regNames.forEach((name, index) => {
    if (name && name.trim() !== "") {
      palette[name] = colors[index % colors.length];
    }
  });
  
  return palette;
};

/**
 * Renders Other Regional Trails layer using ArcGIS FeatureServer for data
 * Data source: https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/export_other_trails/FeatureServer
 * 
 * Uses FeatureServer queries to fetch GeoJSON data for rendering and data extraction (reg_names, metrics).
 * Renders trails as GeoJSON to support filtering by selectedRegNames and color coding.
 * Supports color coding by reg_name attribute when useColorCoding is true.
 */
const OtherRegionalTrailsLayer = ({ 
  showTrailsRegNameSync, 
  showMunicipalityProfileMap, 
  showRegionalTrailsProfile,
  showProjectTrailsProfile,
  mapRef,
  useColorCoding = false,
  onRegNamesChange = null,
  selectedRegNames = [], // Array of selected reg_names to display
  onTrailsDataChange = null, // Callback to pass trail data to parent
  hoveredTrail = null, // Hovered trail object with featureId
  clickedTrail = null // Clicked trail object with featureId
}) => {
  const [trailsData, setTrailsData] = useState(null);
  const updateTimeoutRef = useRef(null);
  const queryTimeoutRef = useRef(null);
  const accumulatedTrailsRef = useRef(new Map()); // Store trails by feature ID to avoid duplicates
  const knownRegNamesRef = useRef(new Set());

  // Determine if layer should be shown
  const shouldShow = showTrailsRegNameSync && (showMunicipalityProfileMap || showRegionalTrailsProfile || showProjectTrailsProfile);

  const publishRegNames = (names) => {
    if (!onRegNamesChange || !names?.length) return;
    names.forEach((name) => knownRegNamesRef.current.add(name));
    onRegNamesChange(Array.from(knownRegNamesRef.current).sort());
  };

  // MapServer URL for tile display (tiles only, doesn't support queries)
  const MAP_SERVER_URL = "https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/export_other_trails_tiles/MapServer";
  
  // FeatureServer URL for data extraction (supports queries)
  const FEATURE_SERVER_URL = "https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/export_other_trails/FeatureServer/0";

  // Initial query to get all reg_names for the project list (runs once)
  useEffect(() => {
    if (!shouldShow || !onRegNamesChange) {
      return;
    }

    // Query for all reg_names - fetch all unique reg_names without geometry filter
    const fetchAllRegNames = async () => {
      if (!ARCGIS_TOKEN) {
        console.error("REACT_APP_ARCGIS_TOKEN is not configured");
        return;
      }

      try {
        const distinctUrl = `${FEATURE_SERVER_URL}/query?where=reg_name IS NOT NULL&outFields=reg_name&returnGeometry=false&returnDistinctValues=true&f=json&maxRecordCount=10000`;
        let response = await fetch(withArcGisToken(distinctUrl));
        let data = await response.json();

        if (data.error || !data.features?.length) {
          const bbox = "-73.5,41.0,-69.5,43.0";
          const fallbackUrl = `${FEATURE_SERVER_URL}/query?where=reg_name IS NOT NULL&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=reg_name&returnGeometry=false&f=json&maxRecordCount=10000`;
          response = await fetch(withArcGisToken(fallbackUrl));
          data = await response.json();
        }

        if (data.error) {
          console.error("Error fetching reg_names from FeatureServer:", data.error);
          return;
        }

        publishRegNames(extractRegNamesFromFeatures(data.features));
      } catch (error) {
        console.error("Error fetching all reg_names from FeatureServer:", error);
      }
    };

    knownRegNamesRef.current.clear();
    fetchAllRegNames();
  }, [shouldShow, onRegNamesChange]);

  // Note: reg_names list is populated by the initial query above
  // trailsData is only used for rendering and metrics, not for populating the project list

  // Generate color palette from current data when useColorCoding is enabled
  const effectiveColorPalette = useMemo(() => {
    if (!useColorCoding) {
      return {};
    }
    
    // Generate from current data
    if (!trailsData || !trailsData.features) {
      return {};
    }
    
    const regNames = new Set();
    trailsData.features.forEach(feature => {
      const regName = feature.properties?.reg_name;
      if (regName && regName.trim() !== "") {
        regNames.add(regName);
      }
    });
    
    const uniqueRegNames = Array.from(regNames).sort();
    return generateColorPalette(uniqueRegNames);
  }, [useColorCoding, trailsData]);

  useEffect(() => {
    if (!shouldShow || !mapRef?.current) {
      setTrailsData(null);
      accumulatedTrailsRef.current.clear(); // Clear accumulated data when layer is hidden
      return;
    }

    const updateLayer = () => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      let url;
      
      // If projects are selected, query all trails for those projects regardless of map bounds
      if (selectedRegNames && selectedRegNames.length > 0) {
        // Build WHERE clause to filter by selected reg_names
        // Escape single quotes in reg_names and build OR conditions
        const whereConditions = selectedRegNames.map(regName => {
          const escapedName = (regName || "").replace(/'/g, "''"); // Escape single quotes for SQL
          return `reg_name = '${escapedName}'`;
        }).join(' OR ');
        
        const whereClause = `(${whereConditions})`;
        
        // Query all trails for selected projects (no geometry filter)
        url = withArcGisToken(
          `${FEATURE_SERVER_URL}/query?where=${encodeURIComponent(whereClause)}&outFields=*&outSR=4326&f=geojson&returnGeometry=true&maxRecordCount=10000`
        );
      } else {
        // No projects selected - use map bounds query for initial data loading
        const zoom = map.getZoom();
        const mapBounds = map.getBounds();
        const sw = mapBounds.getSouthWest();
        const ne = mapBounds.getNorthEast();

        // Expand bounds at lower zoom levels to ensure we capture more trails
        // At zoom < 10, expand by 50%, at zoom < 8, expand by 100%
        const expansionFactor = zoom < 8 ? 1.0 : zoom < 10 ? 0.5 : 0;
        const latRange = ne.lat - sw.lat;
        const lngRange = ne.lng - sw.lng;
        
        const expandedSw = {
          lat: sw.lat - (latRange * expansionFactor),
          lng: sw.lng - (lngRange * expansionFactor)
        };
        const expandedNe = {
          lat: ne.lat + (latRange * expansionFactor),
          lng: ne.lng + (lngRange * expansionFactor)
        };

        // Use lat/lng directly (WGS84) for FeatureServer query
        // Format: xmin,ymin,xmax,ymax (lng,lat,lng,lat) - ensure proper order
        const xmin = Math.min(expandedSw.lng, expandedNe.lng);
        const ymin = Math.min(expandedSw.lat, expandedNe.lat);
        const xmax = Math.max(expandedSw.lng, expandedNe.lng);
        const ymax = Math.max(expandedSw.lat, expandedNe.lat);
        const bbox = `${xmin},${ymin},${xmax},${ymax}`;

        // Query GeoJSON from FeatureServer with token authentication (for data extraction)
        url = withArcGisToken(
          `${FEATURE_SERVER_URL}/query?where=1=1&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&f=geojson&returnGeometry=true&maxRecordCount=2000`
        );
      }

      // Debounce queries
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }

      queryTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(url);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`FeatureServer query failed (${response.status}):`, errorText);
            // Don't clear accumulated data on error
            if (accumulatedTrailsRef.current.size === 0) {
              setTrailsData(null);
            }
            return;
          }
          
          const data = await response.json();
          
          if (data.error) {
            console.error("FeatureServer error:", data.error);
            // Don't clear accumulated data on error
            if (accumulatedTrailsRef.current.size === 0) {
              setTrailsData(null);
            }
            return;
          }
          
          if (data.features && data.features.length > 0) {
            // If querying by selectedRegNames, replace data entirely (don't accumulate)
            // If querying by bounds, accumulate data for panning
            if (selectedRegNames && selectedRegNames.length > 0) {
              // Replace data for selected projects
              const featureCollection = {
                type: "FeatureCollection",
                features: data.features
              };
              accumulatedTrailsRef.current.clear();
              data.features.forEach(feature => {
                const featureId = feature.properties?.OBJECTID || 
                                 feature.properties?.objectid || 
                                 feature.id || 
                                 JSON.stringify(feature.geometry);
                accumulatedTrailsRef.current.set(featureId, feature);
              });
              setTrailsData(featureCollection);
              publishRegNames(extractRegNamesFromFeatures(data.features));

              // Notify parent component of trail data changes
              if (onTrailsDataChange) {
                onTrailsDataChange(featureCollection);
              }
            } else {
              // Accumulate data for bounds-based queries (when panning)
              data.features.forEach(feature => {
                const featureId = feature.properties?.OBJECTID || 
                                 feature.properties?.objectid || 
                                 feature.id || 
                                 JSON.stringify(feature.geometry);
                accumulatedTrailsRef.current.set(featureId, feature);
              });
              
              // Convert accumulated features back to FeatureCollection
              const allFeatures = Array.from(accumulatedTrailsRef.current.values());
              const featureCollection = {
                type: "FeatureCollection",
                features: allFeatures
              };
              setTrailsData(featureCollection);
              publishRegNames(extractRegNamesFromFeatures(allFeatures));

              // Notify parent component of trail data changes
              if (onTrailsDataChange) {
                onTrailsDataChange(featureCollection);
              }
            }
          } else {
            // No features returned
            if (selectedRegNames && selectedRegNames.length > 0) {
              // For selected projects, clear data if no results
              accumulatedTrailsRef.current.clear();
              setTrailsData(null);
              if (onTrailsDataChange) {
                onTrailsDataChange(null);
              }
            } else if (accumulatedTrailsRef.current.size === 0) {
              // Only set to null if we have no accumulated data
              setTrailsData(null);
            }
          }
        } catch (error) {
          console.error("Error fetching export_other_trails FeatureServer data:", error);
          // Don't clear accumulated data on error
          if (accumulatedTrailsRef.current.size === 0) {
            setTrailsData(null);
          }
        }
      }, 300);
    };

    // Clear accumulated data when selectedRegNames changes
    accumulatedTrailsRef.current.clear();
    
    // Initial update
    updateLayer();

    // Only update on map move if no projects are selected (when using bounds-based query)
    // If projects are selected, we've already fetched all trails, so no need to update on move
    const map = mapRef.current?.getMap();
    if (map && (!selectedRegNames || selectedRegNames.length === 0)) {
      const handleMoveEnd = () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(updateLayer, 300);
      };

      map.on('moveend', handleMoveEnd);
      map.on('zoomend', handleMoveEnd);

      return () => {
        map.off('moveend', handleMoveEnd);
        map.off('zoomend', handleMoveEnd);
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        if (queryTimeoutRef.current) {
          clearTimeout(queryTimeoutRef.current);
        }
      };
    } else {
      // Cleanup timeouts if no map move listeners
      return () => {
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        if (queryTimeoutRef.current) {
          clearTimeout(queryTimeoutRef.current);
        }
      };
    }
  }, [shouldShow, mapRef, selectedRegNames]);

  // Render GeoJSON from MapServer queries (data extraction happens separately)
  // trailsData is needed for reg_names extraction, metrics, and rendering
  if (!shouldShow) {
    return null;
  }
  
  // If selectedRegNames is empty array, don't show any trails
  if (selectedRegNames && selectedRegNames.length === 0) {
    return null;
  }
  
  // Need trailsData for rendering
  if (!trailsData || !trailsData.features) {
    return null;
  }

  // If using color coding, create separate layers for each reg_name
  if (useColorCoding && Object.keys(effectiveColorPalette).length > 0) {
    // Filter to only show selected reg_names (if provided)
    // If selectedRegNames is empty, don't show any trails
    const regNamesToShow = selectedRegNames.length > 0 
      ? Object.keys(effectiveColorPalette).filter(regName => {
          // Normalize for comparison (trim and lowercase)
          const normalizedRegName = (regName || "").trim().toLowerCase();
          return selectedRegNames.some(selected => {
            const normalizedSelected = (selected || "").trim().toLowerCase();
            return normalizedRegName === normalizedSelected;
          });
        })
      : [];
    
    if (regNamesToShow.length === 0) {
      return null; // No selected projects, don't show any trails
    }
    
    // For color coding, use GeoJSON from MapServer queries since raster tiles don't support filtering
    // Filter trailsData to only show selected reg_names
    if (!trailsData || !trailsData.features) {
      return null;
    }
    
    const filteredTrailsData = {
      type: "FeatureCollection",
      features: trailsData.features.filter(feature => {
        const featureRegName = (feature.properties?.reg_name || "").trim();
        const segType = feature.properties?.seg_type;
        return regNamesToShow.some(regName => {
          const normalizedRegName = (regName || "").trim().toLowerCase();
          const normalizedFeatureRegName = featureRegName.toLowerCase();
          return normalizedFeatureRegName === normalizedRegName && segType !== 9 && segType !== "9";
        });
      })
    };
    
    const filteredGapsData = {
      type: "FeatureCollection",
      features: trailsData.features.filter(feature => {
        const featureRegName = (feature.properties?.reg_name || "").trim();
        const segType = feature.properties?.seg_type;
        return regNamesToShow.some(regName => {
          const normalizedRegName = (regName || "").trim().toLowerCase();
          const normalizedFeatureRegName = featureRegName.toLowerCase();
          return normalizedFeatureRegName === normalizedRegName && (segType === 9 || segType === "9");
        });
      })
    };
    
    return (
      <>
        {/* Render regular trails with color coding */}
        {regNamesToShow.map((regName) => {
          const color = effectiveColorPalette[regName];
          if (!color) return null;
          
          const regNameTrails = filteredTrailsData.features.filter(f => {
            const fRegName = (f.properties?.reg_name || "").trim().toLowerCase();
            return fRegName === regName.trim().toLowerCase();
          });
          
          if (regNameTrails.length === 0) return null;
          
          return (
            <Source
              key={`trails-reg-name-${regName}`}
              id={`trails-reg-name-source-${regName}`}
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: regNameTrails
              }}
            >
              <Layer
                id={`trails-reg-name-layer-${regName}`}
                type="line"
                paint={{
                  "line-color": color,
                  "line-width": 3,
                  "line-opacity": 0.8
                }}
                layout={{
                  "line-cap": "round",
                  "line-join": "round"
                }}
              />
            </Source>
          );
        })}
        
        {/* Render gaps in red */}
        {filteredGapsData.features.length > 0 && (
          <Source
            id="gaps-other-regional-trails-source"
            type="geojson"
            data={filteredGapsData}
          >
            <Layer
              id="gaps-other-regional-trails-layer"
              type="line"
              paint={{
                "line-color": "#FF0000",
                "line-width": 4,
                "line-opacity": 1.0
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round"
              }}
            />
          </Source>
        )}
      </>
    );
  }

  // Default: Use GeoJSON from MapServer queries for filtering support
  // Get hovered and clicked feature IDs
  const hoveredFeatureId = hoveredTrail?.featureId;
  const clickedFeatureId = clickedTrail?.featureId;

  // Filter trailsData based on selectedRegNames if provided
  let filteredTrailsData = trailsData;
  let filteredGapsData = null;
  
  if (selectedRegNames && selectedRegNames.length > 0 && trailsData && trailsData.features) {
    const regularTrails = trailsData.features.filter(feature => {
      const regName = (feature.properties?.reg_name || "").trim().toLowerCase();
      const segType = feature.properties?.seg_type;
      return selectedRegNames.some(selected => {
        const normalizedSelected = (selected || "").trim().toLowerCase();
        return normalizedSelected === regName && segType !== 9 && segType !== "9";
      });
    });
    
    const gaps = trailsData.features.filter(feature => {
      const regName = (feature.properties?.reg_name || "").trim().toLowerCase();
      const segType = feature.properties?.seg_type;
      return selectedRegNames.some(selected => {
        const normalizedSelected = (selected || "").trim().toLowerCase();
        return normalizedSelected === regName && (segType === 9 || segType === "9");
      });
    });
    
    filteredTrailsData = {
      type: "FeatureCollection",
      features: regularTrails
    };
    
    if (gaps.length > 0) {
      filteredGapsData = {
        type: "FeatureCollection",
        features: gaps
      };
    }
  } else if (trailsData && trailsData.features) {
    // No filtering - show all trails
    filteredTrailsData = {
      type: "FeatureCollection",
      features: trailsData.features.filter(f => {
        const segType = f.properties?.seg_type;
        return segType !== 9 && segType !== "9";
      })
    };
    
    const gaps = trailsData.features.filter(f => {
      const segType = f.properties?.seg_type;
      return segType === 9 || segType === "9";
    });
    
    if (gaps.length > 0) {
      filteredGapsData = {
        type: "FeatureCollection",
        features: gaps
      };
    }
  }

  if (!filteredTrailsData || !filteredTrailsData.features || filteredTrailsData.features.length === 0) {
    return null;
  }

  // Build hover filters
  const regularTrailsHoverFilter = hoveredFeatureId !== null && hoveredFeatureId !== undefined
    ? [
        "==",
        ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
        hoveredFeatureId
      ]
    : ["==", ["get", "OBJECTID"], -1];

  const gapsHoverFilter = hoveredFeatureId !== null && hoveredFeatureId !== undefined
    ? [
        "==",
        ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
        hoveredFeatureId
      ]
    : ["==", ["get", "OBJECTID"], -1];

  // fac_stat can be number 1 or string "1" from ArcGIS - check both for existing (blue)
  const isExistingTrail = ["any", ["==", ["get", "fac_stat"], 1], ["==", ["get", "fac_stat"], "1"]];

  const regularTrailsClickFilter = clickedFeatureId !== null && clickedFeatureId !== undefined
    ? [
        "==",
        ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
        clickedFeatureId
      ]
    : ["==", ["get", "OBJECTID"], -1];

  const gapsClickFilter = clickedFeatureId !== null && clickedFeatureId !== undefined
    ? [
        "==",
        ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
        clickedFeatureId
      ]
    : ["==", ["get", "OBJECTID"], -1];

  return (
    <>
      {/* Regular trails */}
      <Source
        id="other-regional-trails-source"
        type="geojson"
        data={filteredTrailsData}
      >
        <Layer
          id="other-regional-trails-layer"
          type="line"
          paint={{
            "line-color": [
              "case",
              isExistingTrail,
              "#2774bd",  // Blue for existing trails (fac_stat 1 or "1")
              "#6a1b9a"   // Dark purple for planned trails (fac_stat = 2 or 3)
            ],
            "line-width": 3,
            "line-opacity": [
              "case",
              isExistingTrail,
              0.8,   // Slightly transparent for existing
              0.75   // Slightly more transparent for planned
            ]
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round"
          }}
        />
        {/* Hover layer for regular trails - wider */}
        <Layer
          id="other-regional-trails-layer-hover"
          type="line"
          paint={{
            "line-color": [
              "case",
              isExistingTrail,
              "#2774bd",  // Blue for existing trails
              "#6a1b9a"   // Dark purple for planned trails
            ],
            "line-width": 6,
            "line-opacity": 1.0
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round"
          }}
          filter={regularTrailsHoverFilter}
        />
        {/* Click highlight layer for regular trails - thicker when clicked */}
        <Layer
          id="other-regional-trails-layer-click"
          type="line"
          paint={{
            "line-color": [
              "case",
              isExistingTrail,
              "#2774bd",  // Blue for existing trails
              "#6a1b9a"   // Dark purple for planned trails
            ],
            "line-width": 8,
            "line-opacity": 1.0
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round"
          }}
          filter={regularTrailsClickFilter}
        />
      </Source>
      
      {/* Gaps in red */}
      {filteredGapsData && filteredGapsData.features.length > 0 && (
        <Source
          id="gaps-other-regional-trails-source"
          type="geojson"
          data={filteredGapsData}
        >
          <Layer
            id="gaps-other-regional-trails-layer"
            type="line"
            paint={{
              "line-color": "#FF0000",
              "line-width": 4,
              "line-opacity": 1.0
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round"
            }}
          />
          {/* Hover layer for gaps - wider */}
          <Layer
            id="gaps-other-regional-trails-layer-hover"
            type="line"
            paint={{
              "line-color": "#FF0000",
              "line-width": 7,
              "line-opacity": 1.0
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round"
            }}
            filter={gapsHoverFilter}
          />
          {/* Click highlight layer for gaps - thicker when clicked */}
          <Layer
            id="gaps-other-regional-trails-layer-click"
            type="line"
            paint={{
              "line-color": "#FF0000",
              "line-width": 9,
              "line-opacity": 1.0
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round"
            }}
            filter={gapsClickFilter}
          />
        </Source>
      )}
    </>
  );
};

export default OtherRegionalTrailsLayer;
