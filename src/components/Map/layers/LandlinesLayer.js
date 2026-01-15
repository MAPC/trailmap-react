import React, { useEffect, useState, useRef } from "react";
import { Source, Layer } from "react-map-gl";

/**
 * Renders Landlines layer from MAPC FeatureServer
 * Data source: https://geo.mapc.org/server/rest/services/transportation/landlines/FeatureServer/0/
 * 
 * Filters for features where reg_name IS NOT NULL
 * Uses ArcGIS FeatureServer query endpoint to fetch GeoJSON features within current map bounds.
 */
const LandlinesLayer = ({ showLandlines, showMunicipalityProfileMap, mapRef }) => {
  const [landlinesData, setLandlinesData] = useState(null);
  const updateTimeoutRef = useRef(null);
  const queryTimeoutRef = useRef(null);

  useEffect(() => {
    if (!showLandlines || !showMunicipalityProfileMap || !mapRef?.current) {
      setLandlinesData(null);
      return;
    }

    const updateLayer = () => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const mapBounds = map.getBounds();
      const sw = mapBounds.getSouthWest();
      const ne = mapBounds.getNorthEast();

      // Convert lat/lon to Web Mercator (EPSG:3857) for ArcGIS query
      const toWebMercator = (lon, lat) => {
        const x = lon * 20037508.34 / 180;
        let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * 20037508.34 / 180;
        return { x, y };
      };

      const swMerc = toWebMercator(sw.lng, sw.lat);
      const neMerc = toWebMercator(ne.lng, ne.lat);

      const LANDLINES_SERVICE_URL = "https://geo.mapc.org/server/rest/services/transportation/landlines/FeatureServer/0";
      const bbox = `${swMerc.x},${swMerc.y},${neMerc.x},${neMerc.y}`;

      // Query GeoJSON from FeatureServer - filter for reg_name IS NOT NULL
      const url = `${LANDLINES_SERVICE_URL}/query?where=reg_name IS NOT NULL&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=3857&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&f=geojson&returnGeometry=true&maxRecordCount=2000`;

      // Debounce queries
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }

      queryTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            setLandlinesData({
              type: "FeatureCollection",
              features: data.features
            });
          } else {
            setLandlinesData(null);
          }
        } catch (error) {
          console.error("Error fetching Landlines data:", error);
          setLandlinesData(null);
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
  }, [showLandlines, showMunicipalityProfileMap, mapRef]);

  // Helper function to get color based on seg_type and fac_stat
  const getLineColor = (segType, facStat) => {
    // Based on the renderer from the FeatureServer documentation
    const key = `${segType},${facStat}`;
    
    const colorMap = {
      '1,1': '#00A884', // Shared Use Path - Existing
      '1,2': '#00A884', // Shared Use Path - Design
      '1,3': '#00A884', // Shared Use Path - Envisioned (dashed)
      '2,1': '#0070FF', // Protected Bike Lane and Sidewalk
      '2,2': '#0070FF', // Protected Bike Lane - Design or Construction
      '2,3': '#0070FF', // Protected Bike Lane - Design or Construction
      '3,1': '#73B2FF', // Bike Lane and Sidewalk
      '3,2': '#73B2FF', // Bike Lane - Design or Construction
      '3,3': '#73B2FF', // Bike Lane - Design or Construction
      '4,1': '#D7C29E', // Shared Street - Urban
      '4,3': '#D7C29E', // Shared Street - Urban
      '5,1': '#D7C29E', // Shared Street - Suburban
      '5,3': '#D7C29E', // Shared Street - Envisioned (dashed)
      '6,1': '#C7D79E', // Shared Use Path - Unimproved Surface
      '6,2': '#C7D79E', // Shared Use Path - Unimproved Surface
      '6,3': '#C7D79E', // Shared Use Path - Unimproved Surface
      '11,1': '#A87196', // Foot Trail - Natural Surface
      '11,2': '#A87196',
      '11,3': '#A87196',
      '12,1': '#903366', // Foot Trail - Roadway Section
      '12,2': '#903366',
      '12,3': '#903366',
    };
    
    return colorMap[key] || '#666666'; // Default gray
  };

  // Helper function to get dash array based on fac_stat
  const getDashArray = (facStat) => {
    // fac_stat: 1 = Existing, 2 = Design/Construction, 3 = Envisioned
    if (facStat === 3) {
      return [4, 2]; // Dashed for envisioned
    }
    return null; // Solid for existing and design
  };

  // Helper function to get line width
  const getLineWidth = (segType, facStat) => {
    const key = `${segType},${facStat}`;
    if (key === '1,3' || key === '5,3') {
      return 3; // Thinner for envisioned
    }
    return 5; // Default width
  };

  if (!showLandlines || !showMunicipalityProfileMap || !landlinesData) {
    return null;
  }

  // Group features by style (seg_type, fac_stat combination)
  const styleGroups = {};
  landlinesData.features.forEach(feature => {
    const props = feature.properties || {};
    const segType = props.seg_type || props.SEG_TYPE;
    const facStat = props.fac_stat || props.FAC_STAT;
    const key = `${segType},${facStat}`;
    
    if (!styleGroups[key]) {
      styleGroups[key] = {
        color: getLineColor(segType, facStat),
        dashArray: getDashArray(facStat),
        width: getLineWidth(segType, facStat),
        features: []
      };
    }
    styleGroups[key].features.push(feature);
  });

  return (
    <>
      {Object.entries(styleGroups).map(([key, style]) => (
        <Source
          key={`landlines-${key}`}
          id={`landlines-source-${key}`}
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: style.features
          }}
        >
          <Layer
            id={`landlines-layer-${key}`}
            type="line"
            paint={{
              "line-color": style.color,
              "line-width": style.width,
              "line-opacity": 0.8
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
              ...(style.dashArray && { "line-dasharray": style.dashArray })
            }}
          />
        </Source>
      ))}
    </>
  );
};

export default LandlinesLayer;

