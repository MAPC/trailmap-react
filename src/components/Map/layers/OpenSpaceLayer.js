import React, { useEffect, useState, useRef } from "react";
import { Source, Layer } from "react-map-gl";

/**
 * Renders OpenSpace (Protected and Recreational OpenSpace) layer
 * Data source: https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/openspace/FeatureServer/0
 * 
 * Uses ArcGIS FeatureServer query endpoint to fetch GeoJSON features within current map bounds.
 */
const OpenSpaceLayer = ({ showOpenSpace, showMunicipalityProfileMap, mapRef }) => {
  const [openSpaceData, setOpenSpaceData] = useState(null);
  const [bounds, setBounds] = useState(null);
  const updateTimeoutRef = useRef(null);
  const queryTimeoutRef = useRef(null);

  useEffect(() => {
    if (!showOpenSpace || !showMunicipalityProfileMap || !mapRef?.current) {
      setOpenSpaceData(null);
      setBounds(null);
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

      const OPENSPACE_SERVICE_URL = "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/openspace/FeatureServer/0";
      const bbox = `${swMerc.x},${swMerc.y},${neMerc.x},${neMerc.y}`;

      // Query GeoJSON from FeatureServer
      const url = `${OPENSPACE_SERVICE_URL}/query?where=1=1&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=3857&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&f=geojson&returnGeometry=true&maxRecordCount=1000`;

      // Debounce queries
      if (queryTimeoutRef.current) {
        clearTimeout(queryTimeoutRef.current);
      }

      queryTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            setOpenSpaceData({
              type: "FeatureCollection",
              features: data.features
            });
            setBounds([
              [sw.lng, sw.lat],
              [ne.lng, ne.lat]
            ]);
          } else {
            setOpenSpaceData(null);
          }
        } catch (error) {
          console.error("Error fetching OpenSpace data:", error);
          setOpenSpaceData(null);
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
  }, [showOpenSpace, showMunicipalityProfileMap, mapRef]);

  // Handle hover events - removed, will be handled in parent component's onMouseMove

  if (!showOpenSpace || !showMunicipalityProfileMap || !openSpaceData) {
    return null;
  }

  return (
    <Source
      id="openspace-source"
      type="geojson"
      data={openSpaceData}
    >
      <Layer
        id="openspace-layer"
        type="fill"
        paint={{
          "fill-color": "#73B273",
          "fill-opacity": 0.3
        }}
        interactive={true}
      />
      <Layer
        id="openspace-outline"
        type="line"
        paint={{
          "line-color": "#458A45",
          "line-width": 1,
          "line-opacity": 0.6
        }}
        interactive={true}
      />
    </Source>
  );
};

export default OpenSpaceLayer;

