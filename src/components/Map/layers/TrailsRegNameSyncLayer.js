import React, { useEffect, useState, useRef, useMemo } from "react";
import { Source, Layer } from "react-map-gl";

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
 * Renders Trails Reg Name Sync layer from ArcGIS FeatureServer
 * Data source: https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/Trails_Reg_Name_Sync/FeatureServer
 * 
 * Uses FeatureServer query endpoint to fetch GeoJSON features within current map bounds.
 * Supports color coding by reg_name attribute when useColorCoding is true.
 */
const TrailsRegNameSyncLayer = ({ 
  showTrailsRegNameSync, 
  showMunicipalityProfileMap, 
  showProjectTrailsProfile,
  mapRef,
  useColorCoding = false,
  onRegNamesChange = null,
  colorPalette = null, // External color palette for stable colors
  selectedRegNames = [], // Array of selected reg_names to display
  onTrailsDataChange = null, // Callback to pass trail data to parent
  hoveredTrail = null // Hovered trail object with featureId
}) => {
  const [trailsData, setTrailsData] = useState(null);
  const updateTimeoutRef = useRef(null);
  const queryTimeoutRef = useRef(null);
  const accumulatedTrailsRef = useRef(new Map()); // Store trails by feature ID to avoid duplicates

  // Determine if layer should be shown
  const shouldShow = showTrailsRegNameSync && (showMunicipalityProfileMap || showProjectTrailsProfile);

  // Extract unique reg_name values and notify parent
  useEffect(() => {
    if (trailsData && trailsData.features && onRegNamesChange) {
      const regNames = new Set();
      trailsData.features.forEach(feature => {
        const regName = feature.properties?.reg_name;
        if (regName && regName.trim() !== "") {
          regNames.add(regName);
        }
      });
      
      const uniqueRegNames = Array.from(regNames).sort();
      onRegNamesChange(uniqueRegNames);
    }
  }, [trailsData, onRegNamesChange]);

  // Use external color palette if provided, otherwise generate one
  const effectiveColorPalette = useMemo(() => {
    if (!useColorCoding) {
      return {};
    }
    
    // If external palette is provided, use it
    if (colorPalette && Object.keys(colorPalette).length > 0) {
      return colorPalette;
    }
    
    // Otherwise, generate from current data (fallback)
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
  }, [useColorCoding, colorPalette, trailsData]);

  useEffect(() => {
    if (!shouldShow || !mapRef?.current) {
      setTrailsData(null);
      accumulatedTrailsRef.current.clear(); // Clear accumulated data when layer is hidden
      return;
    }

    const updateLayer = () => {
      const map = mapRef.current?.getMap();
      if (!map) return;

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

      // Convert lat/lon to Web Mercator (EPSG:3857) for ArcGIS query
      const toWebMercator = (lon, lat) => {
        const x = lon * 20037508.34 / 180;
        let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * 20037508.34 / 180;
        return { x, y };
      };

      const swMerc = toWebMercator(expandedSw.lng, expandedSw.lat);
      const neMerc = toWebMercator(expandedNe.lng, expandedNe.lat);

      const TRAILS_SERVICE_URL = "https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/Trails_Reg_Name_Sync/FeatureServer/0";
      const bbox = `${swMerc.x},${swMerc.y},${neMerc.x},${neMerc.y}`;
      
      // ArcGIS token for authentication
      const ARCGIS_TOKEN = "AAPTaucDi8_DdZbjNjhaAYvWCQA..A05LEOZ-QCx9bKC21Tsk1K0A7Yoql8kZNK3V7F7COkFiE0vn0bVYZti5Eaq_Db7r4UqKV1Y02-9ilPUWjj0barvUV7sdmMM2AgnBJEYMapTJKRzGHJBBGfQV_8KlE5scYMM4iNUNpj7TVvKklvCfr764dCKDmt6ubnI2rW9mRBj7dGZLwbmbKMJFiNx2wAiZoDFGClDOcsxt83kCFCjoGug-Jhqwb0xdl_9lpX38IIoKJ0JAcmgkF6MmiwY9Zgm4Z23T_sSUdSo.AT1_U0702ST1"

      // Query GeoJSON from FeatureServer with token authentication
      const url = `${TRAILS_SERVICE_URL}/query?where=1=1&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=3857&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&f=geojson&returnGeometry=true&maxRecordCount=2000&token=${ARCGIS_TOKEN}`;

      // Debounce queries
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }

      queryTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            // Add new features to accumulated data, using OBJECTID or a unique identifier
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
            
            // Notify parent component of trail data changes
            if (onTrailsDataChange) {
              onTrailsDataChange(featureCollection);
            }
          } else if (accumulatedTrailsRef.current.size === 0) {
            // Only set to null if we have no accumulated data
            setTrailsData(null);
          }
        } catch (error) {
          console.error("Error fetching Trails Reg Name Sync data:", error);
          // Don't clear accumulated data on error
          if (accumulatedTrailsRef.current.size === 0) {
            setTrailsData(null);
          }
        }
      }, 300);
    };

    // Initial update
    updateLayer();

    // Update on map move (with debounce)
    const map = mapRef.current?.getMap();
    if (map) {
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
    }
  }, [shouldShow, mapRef]);

  if (!shouldShow || !trailsData) {
    return null;
  }

  // If using color coding, create separate layers for each reg_name
  if (useColorCoding && Object.keys(effectiveColorPalette).length > 0) {
    // Filter to only show selected reg_names (if provided)
    // If selectedRegNames is empty, don't show any trails
    const regNamesToShow = selectedRegNames.length > 0 
      ? Object.keys(effectiveColorPalette).filter(regName => selectedRegNames.includes(regName))
      : [];
    
    if (regNamesToShow.length === 0) {
      return null; // No selected projects, don't show any trails
    }
    
    return (
      <>
        {/* Render regular trails first */}
        {regNamesToShow.map((regName) => {
          const color = effectiveColorPalette[regName];
          if (!color) return null;
          
          const filteredFeatures = trailsData.features.filter(
            feature => {
              const featureRegName = (feature.properties?.reg_name || "").trim();
              const segType = feature.properties?.seg_type;
              // Exclude gaps (seg_type === 9) from regular trail layer
              return featureRegName === regName.trim() && segType !== 9 && segType !== "9";
            }
          );
          
          if (filteredFeatures.length === 0) return null;
          
          return (
            <Source
              key={`trails-reg-name-${regName}`}
              id={`trails-reg-name-source-${regName}`}
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: filteredFeatures
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
        
        {/* Render gaps in red on top of regular trails */}
        {regNamesToShow.map((regName) => {
          const filteredGapFeatures = trailsData.features.filter(
            feature => {
              const featureRegName = (feature.properties?.reg_name || "").trim();
              const segType = feature.properties?.seg_type;
              // Only include gaps (seg_type === 9) for this reg_name
              return featureRegName === regName.trim() && (segType === 9 || segType === "9");
            }
          );
          
          if (filteredGapFeatures.length === 0) return null;
          
          return (
            <Source
              key={`gaps-reg-name-${regName}`}
              id={`gaps-reg-name-source-${regName}`}
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: filteredGapFeatures
              }}
            >
              <Layer
                id={`gaps-reg-name-layer-${regName}`}
                type="line"
                paint={{
                  "line-color": "#FF0000", // Red color for gaps
                  "line-width": 4, // Slightly thicker to make gaps stand out
                  "line-opacity": 1.0
                }}
                layout={{
                  "line-cap": "round",
                  "line-join": "round"
                }}
              />
            </Source>
          );
        })}
      </>
    );
  }

  // Default: single layer with single color
  // Filter trails based on selectedRegNames if provided
  let filteredTrailsData = trailsData;
  if (selectedRegNames && selectedRegNames.length > 0) {
    filteredTrailsData = {
      type: "FeatureCollection",
      features: trailsData.features.filter(feature => {
        const regName = (feature.properties?.reg_name || "").trim();
        return selectedRegNames.some(selected => selected.trim() === regName);
      })
    };
  } else if (selectedRegNames && selectedRegNames.length === 0) {
    // If selectedRegNames is empty array, don't show any trails
    return null;
  }

  // Get hovered feature ID
  const hoveredFeatureId = hoveredTrail?.featureId;

  return (
    <Source
      id="trails-reg-name-sync-source"
      type="geojson"
      data={filteredTrailsData}
    >
      {/* Regular trails (excluding gaps) */}
      <Layer
        id="trails-reg-name-sync-layer"
        type="line"
        paint={{
          "line-color": "#2774bd",
          "line-width": 3,
          "line-opacity": 0.8
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
        filter={["!=", ["get", "seg_type"], 9]}
      />
      {/* Hover layer for regular trails - wider */}
      <Layer
        id="trails-reg-name-sync-layer-hover"
        type="line"
        paint={{
          "line-color": "#2774bd",
          "line-width": 6,
          "line-opacity": 1.0
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
        filter={
          hoveredFeatureId !== null && hoveredFeatureId !== undefined
            ? [
                "all",
                ["!=", ["get", "seg_type"], 9],
                [
                  "==",
                  ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
                  hoveredFeatureId
                ]
              ]
            : ["==", ["get", "OBJECTID"], -1]
        }
      />
      {/* Gaps in red */}
      <Layer
        id="gaps-reg-name-sync-layer"
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
        filter={["==", ["get", "seg_type"], 9]}
      />
      {/* Hover layer for gaps - wider */}
      <Layer
        id="gaps-reg-name-sync-layer-hover"
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
        filter={
          hoveredFeatureId !== null && hoveredFeatureId !== undefined
            ? [
                "all",
                ["==", ["get", "seg_type"], 9],
                [
                  "==",
                  ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
                  hoveredFeatureId
                ]
              ]
            : ["==", ["get", "OBJECTID"], -1]
        }
      />
    </Source>
  );
};

export default TrailsRegNameSyncLayer;
