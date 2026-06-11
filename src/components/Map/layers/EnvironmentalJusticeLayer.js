import React, { useEffect, useState, useRef } from "react";
import { Source, Layer } from "react-map-gl";

/**
 * Renders Environmental Justice 2020 layer
 * Data source: https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer
 * 
 * Uses ArcGIS MapServer export endpoint with current map bounds.
 * Note: This creates a single image overlay that updates with map movement.
 * For better performance with large datasets, consider using a tile proxy service.
 */
const EnvironmentalJusticeLayer = ({ showEnvironmentalJustice, showMunicipalityProfileMap, showProjectTrailsProfile, mapRef }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [bounds, setBounds] = useState(null);
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    if (!showEnvironmentalJustice || (!showMunicipalityProfileMap && !showProjectTrailsProfile) || !mapRef?.current) {
      setImageUrl(null);
      setBounds(null);
      return;
    }

    const updateLayer = () => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const mapBounds = map.getBounds();
      const sw = mapBounds.getSouthWest();
      const ne = mapBounds.getNorthEast();

      // Convert lat/lon to Web Mercator (EPSG:3857)
      const toWebMercator = (lon, lat) => {
        const x = lon * 20037508.34 / 180;
        let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * 20037508.34 / 180;
        return { x, y };
      };

      const swMerc = toWebMercator(sw.lng, sw.lat);
      const neMerc = toWebMercator(ne.lng, ne.lat);

      const EJ2020_SERVICE_URL = "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/EJ2020/MapServer";
      const bbox = `${swMerc.x},${swMerc.y},${neMerc.x},${neMerc.y}`;
      
      // Get map size for export
      const mapSize = map.getContainer();
      const width = mapSize.clientWidth || 1024;
      const height = mapSize.clientHeight || 768;

      const url = `${EJ2020_SERVICE_URL}/export?bbox=${bbox}&bboxSR=3857&imageSR=3857&size=${width},${height}&f=image&format=png&transparent=true&layers=show:0`;
      
      setImageUrl(url);
      setBounds([
        [sw.lng, sw.lat],
        [ne.lng, ne.lat]
      ]);
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
      };
    }
  }, [showEnvironmentalJustice, showMunicipalityProfileMap, showProjectTrailsProfile, mapRef]);

  if (
    !showEnvironmentalJustice ||
    (!showMunicipalityProfileMap && !showProjectTrailsProfile) ||
    !imageUrl ||
    !bounds
  ) {
    return null;
  }

  return (
    <Source
      id="environmental-justice-2020"
      type="image"
      url={imageUrl}
      coordinates={[
        [bounds[0][0], bounds[1][1]], // top-left
        [bounds[1][0], bounds[1][1]], // top-right
        [bounds[1][0], bounds[0][1]], // bottom-right
        [bounds[0][0], bounds[0][1]]  // bottom-left
      ]}
    >
      <Layer
        id="environmental-justice-layer"
        type="raster"
        paint={{
          "raster-opacity": 0.7
        }}
      />
    </Source>
  );
};

export default EnvironmentalJusticeLayer;

