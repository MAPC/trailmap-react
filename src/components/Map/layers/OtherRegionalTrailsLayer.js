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
 * Uses FeatureServer queries to fetch GeoJSON for selected reg_names only
 * (no continuous viewport queries while panning). Also fetches distinct
 * reg_names once for the Regional Profile project list.
 */
const OtherRegionalTrailsLayer = ({ 
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
  const queryTimeoutRef = useRef(null);
  const accumulatedTrailsRef = useRef(new Map()); // Store trails by feature ID to avoid duplicates
  const knownRegNamesRef = useRef(new Set());
  const onTrailsDataChangeRef = useRef(onTrailsDataChange);
  const onRegNamesChangeRef = useRef(onRegNamesChange);
  const fetchedSelectionKeyRef = useRef(null);

  useEffect(() => {
    onTrailsDataChangeRef.current = onTrailsDataChange;
  }, [onTrailsDataChange]);

  useEffect(() => {
    onRegNamesChangeRef.current = onRegNamesChange;
  }, [onRegNamesChange]);

  // Stable content key so parent Array.from(selectedRegNames) does not re-fetch
  const selectedRegNamesKey = Array.isArray(selectedRegNames)
    ? [...selectedRegNames].filter(Boolean).sort().join("\0")
    : "";

  // Determine if layer should be shown
  const shouldShow = showMunicipalityProfileMap || showRegionalTrailsProfile || showProjectTrailsProfile;

  const publishRegNames = (names) => {
    const cb = onRegNamesChangeRef.current;
    if (!cb || !names?.length) return;
    names.forEach((name) => knownRegNamesRef.current.add(name));
    cb(Array.from(knownRegNamesRef.current).sort());
  };

  // MapServer URL for tile display (tiles only, doesn't support queries)
  const MAP_SERVER_URL = "https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/export_other_trails_tiles/MapServer";
  
  // FeatureServer URL for data extraction (supports queries)
  const FEATURE_SERVER_URL = "https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/export_other_trails/FeatureServer/0";

  // Initial query to get all reg_names for the project list (runs once when shown)
  useEffect(() => {
    if (!shouldShow || !onRegNamesChangeRef.current) {
      return;
    }

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
  }, [shouldShow]);

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

  // Fetch trail geometries once per selected project set, then stop.
  useEffect(() => {
    if (!shouldShow) {
      fetchedSelectionKeyRef.current = null;
      setTrailsData(null);
      accumulatedTrailsRef.current.clear();
      onTrailsDataChangeRef.current?.(null);
      return;
    }

    if (!selectedRegNamesKey) {
      fetchedSelectionKeyRef.current = null;
      setTrailsData(null);
      accumulatedTrailsRef.current.clear();
      onTrailsDataChangeRef.current?.(null);
      return;
    }

    // Already fetched this exact selection — do not call the API again
    if (fetchedSelectionKeyRef.current === selectedRegNamesKey) {
      return;
    }

    const selectedNames = selectedRegNamesKey.split("\0").filter(Boolean);
    const whereConditions = selectedNames
      .map((regName) => {
        const escapedName = regName.replace(/'/g, "''");
        return `reg_name = '${escapedName}'`;
      })
      .join(" OR ");

    const url = withArcGisToken(
      `${FEATURE_SERVER_URL}/query?where=${encodeURIComponent(
        `(${whereConditions})`
      )}&outFields=*&outSR=4326&f=geojson&returnGeometry=true&maxRecordCount=10000`
    );

    let cancelled = false;
    if (queryTimeoutRef.current) clearTimeout(queryTimeoutRef.current);

    queryTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(url);
        if (cancelled) return;

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`FeatureServer query failed (${response.status}):`, errorText);
          fetchedSelectionKeyRef.current = null;
          setTrailsData(null);
          accumulatedTrailsRef.current.clear();
          onTrailsDataChangeRef.current?.(null);
          return;
        }

        const data = await response.json();
        if (cancelled) return;

        if (data.error) {
          console.error("FeatureServer error:", data.error);
          fetchedSelectionKeyRef.current = null;
          setTrailsData(null);
          accumulatedTrailsRef.current.clear();
          onTrailsDataChangeRef.current?.(null);
          return;
        }

        const features = data.features || [];
        accumulatedTrailsRef.current.clear();
        features.forEach((feature) => {
          const featureId =
            feature.properties?.OBJECTID ||
            feature.properties?.objectid ||
            feature.id ||
            JSON.stringify(feature.geometry);
          accumulatedTrailsRef.current.set(featureId, feature);
        });

        const featureCollection = {
          type: "FeatureCollection",
          features,
        };
        fetchedSelectionKeyRef.current = selectedRegNamesKey;
        setTrailsData(features.length > 0 ? featureCollection : null);
        if (features.length > 0) {
          publishRegNames(extractRegNamesFromFeatures(features));
        }
        onTrailsDataChangeRef.current?.(
          features.length > 0 ? featureCollection : null
        );
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching export_other_trails FeatureServer data:", error);
        fetchedSelectionKeyRef.current = null;
        setTrailsData(null);
        accumulatedTrailsRef.current.clear();
        onTrailsDataChangeRef.current?.(null);
      }
    }, 300);

    return () => {
      cancelled = true;
      if (queryTimeoutRef.current) clearTimeout(queryTimeoutRef.current);
    };
  }, [shouldShow, selectedRegNamesKey]);

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
