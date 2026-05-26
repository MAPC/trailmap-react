import React, { useEffect, useState, useRef } from "react";
import { Source, Layer } from "react-map-gl";

/**
 * Renders Major Trails layer from ArcGIS FeatureServer
 * Data source: https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/export_major_trails/FeatureServer
 * 
 * Uses FeatureServer query endpoint to fetch GeoJSON features filtered by grouped_reg_name.
 * When selectedMajorTrails is provided, only shows trails matching those grouped_reg_name values.
 */
const MajorTrailsLayer = ({ 
  showMajorTrails,
  showRegionalTrailsProfile,
  mapRef,
  selectedMajorTrails = [], // Array of selected major trail names (grouped_reg_name values)
  onTrailsDataChange = null, // Callback to pass trail data to parent (for metrics)
  hoveredTrail = null, // Hovered trail object with featureId
  clickedTrail = null // Clicked trail object with featureId
}) => {
  const [trailsData, setTrailsData] = useState(null);
  const updateTimeoutRef = useRef(null);
  const queryTimeoutRef = useRef(null);
  const accumulatedTrailsRef = useRef(new Map()); // Store trails by feature ID to avoid duplicates

  // Determine if layer should be shown
  const shouldShow = showMajorTrails && showRegionalTrailsProfile;

  // ArcGIS token for authentication
  const ARCGIS_TOKEN = "AAPTxy8BH1VEsoebNVZXo8HurFEryhzMUuo6HFsZYNxtvAILm5qQYklTujgW8rejiSVEA_kTru4Y7QuNe5-QWMtEpK-_L9TLSHlHV4h_oeYUONaR40fn8mVNBCPvWBSuheHtx9FPMu5xWNxz4gqnZ-TPnErmJVpoN7thS4Zj2QiLg12SqmtHyaMnnYJH5AwdRA1VAFZLZrfwWTLw4zLogHqqonCw58CKKRJS4rqd-UgsAO8.AT1_U0702ST1";

  // FeatureServer URL
  const FEATURE_SERVER_URL = "https://services.arcgis.com/c5WwApDsDjRhIVkH/arcgis/rest/services/export_major_trails/FeatureServer/0";

  useEffect(() => {
    if (!shouldShow || !mapRef?.current || !selectedMajorTrails || selectedMajorTrails.length === 0) {
      setTrailsData(null);
      accumulatedTrailsRef.current.clear();
      if (onTrailsDataChange) {
        onTrailsDataChange(null);
      }
      return;
    }

    const updateLayer = () => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      // Build where clause based on selected major trails
      const escapedTrails = selectedMajorTrails.map(trail => 
        `'${trail.replace(/'/g, "''")}'`
      );
      const whereClause = `grouped_reg_name IN (${escapedTrails.join(',')})`;

      // Query all trails for selected major trails regardless of map bounds/zoom level
      const url = `${FEATURE_SERVER_URL}/query?where=${encodeURIComponent(whereClause)}&outFields=*&outSR=4326&f=geojson&returnGeometry=true&maxRecordCount=10000&token=${ARCGIS_TOKEN}`;

      // Debounce queries (reduced delay for better UX)
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }

      queryTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.error) {
            console.error("FeatureServer error:", data.error);
            return;
          }
          
          if (data.features && data.features.length > 0) {
            // Replace data entirely (don't accumulate) since we're fetching all trails for selected projects
            accumulatedTrailsRef.current.clear();
            data.features.forEach(feature => {
              const featureId = feature.properties?.OBJECTID || 
                               feature.properties?.objectid || 
                               feature.id || 
                               JSON.stringify(feature.geometry);
              accumulatedTrailsRef.current.set(featureId, feature);
            });
            
            const featureCollection = {
              type: "FeatureCollection",
              features: data.features
            };
            setTrailsData(featureCollection);
            
            // Notify parent component of trail data changes for metrics
            if (onTrailsDataChange) {
              onTrailsDataChange(featureCollection);
            }
          } else {
            // No features returned - clear data
            accumulatedTrailsRef.current.clear();
            setTrailsData(null);
            if (onTrailsDataChange) {
              onTrailsDataChange(null);
            }
          }
        } catch (error) {
          console.error("Error fetching Major Trails data:", error);
          if (accumulatedTrailsRef.current.size === 0) {
            setTrailsData(null);
          }
        }
      }, 100);
    };

    // Clear accumulated data when selectedMajorTrails changes
    accumulatedTrailsRef.current.clear();
    
    // Initial update
    updateLayer();

    // No need to update on map move since we're fetching all trails regardless of bounds
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }
    };
  }, [shouldShow, mapRef, selectedMajorTrails, onTrailsDataChange]);

  if (!shouldShow || !trailsData || !trailsData.features || trailsData.features.length === 0) {
    return null;
  }

  // Filter trails based on selected major trails
  let filteredTrailsData = trailsData;
  if (selectedMajorTrails && selectedMajorTrails.length > 0) {
    filteredTrailsData = {
      type: "FeatureCollection",
      features: trailsData.features.filter(feature => {
        const groupedRegName = (feature.properties?.grouped_reg_name || "").trim();
        return selectedMajorTrails.some(selected => {
          const normalizedSelected = (selected || "").trim();
          return normalizedSelected === groupedRegName;
        });
      })
    };
  } else {
    return null; // Don't show anything if no major trails selected
  }

  if (!filteredTrailsData.features || filteredTrailsData.features.length === 0) {
    return null;
  }

  // Get hovered and clicked feature IDs for highlights
  const hoveredFeatureId = hoveredTrail?.featureId;
  const clickedFeatureId = clickedTrail?.featureId;

  // fac_stat can be number 1 or string "1" from ArcGIS - check both for existing (blue)
  const isExistingTrail = ["any", ["==", ["get", "fac_stat"], 1], ["==", ["get", "fac_stat"], "1"]];

  return (
    <Source
      id="major-trails-source"
      type="geojson"
      data={filteredTrailsData}
    >
      {/* Combined trails layer - gaps in red, existing in blue, planned/envisioned/design in green */}
      <Layer
        id="major-trails-layer"
        type="line"
        paint={{
          "line-color": [
            "case",
            ["==", ["get", "seg_type"], 9],
            "#FF0000",  // Red for gaps
              [
                "case",
                isExistingTrail,
                "#2774bd",  // Blue for existing trails (fac_stat 1 or "1")
                "#6a1b9a"   // Dark purple for planned trails (fac_stat = 2 or 3)
              ]
          ],
          "line-width": [
            "case",
            ["==", ["get", "seg_type"], 9],
            5,  // Thicker for gaps
            4   // Regular width for trails
          ],
          "line-opacity": [
            "case",
            ["==", ["get", "seg_type"], 9],
            1.0,  // Full opacity for gaps
            [
              "case",
              isExistingTrail,
              0.9,  // Slightly transparent for existing
              0.85  // Slightly more transparent for planned
            ]
          ]
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
      />
      {/* Hover layer - thicker line when hovering */}
      <Layer
        id="major-trails-layer-hover"
        type="line"
        paint={{
          "line-color": [
            "case",
            ["==", ["get", "seg_type"], 9],
            "#FF0000",  // Red for gaps
            [
              "case",
              isExistingTrail,
              "#2774bd",  // Blue for existing trails
              "#6a1b9a"   // Dark purple for planned trails
            ]
          ],
          "line-width": [
            "case",
            ["==", ["get", "seg_type"], 9],
            8,  // Thicker for gaps on hover
            7   // Thicker for trails on hover
          ],
          "line-opacity": 1.0
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
        filter={
          hoveredFeatureId !== null && hoveredFeatureId !== undefined
            ? [
                "==",
                ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
                hoveredFeatureId
              ]
            : ["==", ["get", "OBJECTID"], -1]
        }
      />
      {/* Click highlight layer - thicker line when clicked, persists until tooltip closes */}
      <Layer
        id="major-trails-layer-click"
        type="line"
        paint={{
          "line-color": [
            "case",
            ["==", ["get", "seg_type"], 9],
            "#FF0000",  // Red for gaps
            [
              "case",
              isExistingTrail,
              "#2774bd",  // Blue for existing trails
              "#6a1b9a"   // Dark purple for planned trails
            ]
          ],
          "line-width": [
            "case",
            ["==", ["get", "seg_type"], 9],
            9,  // Thicker for gaps when clicked
            8   // Thicker for trails when clicked
          ],
          "line-opacity": 1.0
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round"
        }}
        filter={
          clickedFeatureId !== null && clickedFeatureId !== undefined
            ? [
                "==",
                ["coalesce", ["get", "OBJECTID"], ["get", "objectid"], ["get", "id"], -1],
                clickedFeatureId
              ]
            : ["==", ["get", "OBJECTID"], -1]
        }
      />
    </Source>
  );
};

export default MajorTrailsLayer;
