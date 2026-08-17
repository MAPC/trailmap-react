import React, { useEffect, useState, useRef } from "react";
import { Source, Layer } from "react-map-gl";
import bbox from "@turf/bbox";
import { fetchOpenSpaceByTownId } from "../../../utils/fetchOpenSpace";

const MASSGIS_OPENSPACE_URL =
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/openspace/FeatureServer/0";

const DEFAULT_FIT_BOUNDS_OPTIONS = {
  padding: 50,
  duration: 1000,
  maxZoom: 14,
};

const fitMapToOpenSpaceExtent = (mapRef, geojson, options = {}) => {
  const map = mapRef?.current?.getMap?.();
  if (!map || !geojson?.features?.length) return;

  try {
    let [minLng, minLat, maxLng, maxLat] = bbox(geojson);
    if (![minLng, minLat, maxLng, maxLat].every(Number.isFinite)) return;

    if (minLng === maxLng || minLat === maxLat) {
      const pad = 0.002;
      minLng -= pad;
      maxLng += pad;
      minLat -= pad;
      maxLat += pad;
    }

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { ...DEFAULT_FIT_BOUNDS_OPTIONS, ...options }
    );
  } catch (error) {
    console.error("Error zooming to open space extent:", error);
  }
};

/**
 * Protected / recreational open space layer.
 *
 * When townId is provided (Overview "Show on map" or Regional Profile communities):
 *   fetch by town_id from local API (single id or comma-separated, e.g. "1,3,4,5").
 * Otherwise (Map layers toggle without town ids): MassGIS viewport query.
 */
const OpenSpaceLayer = ({
  showOpenSpace,
  showMunicipalityProfileMap,
  showProjectTrailsProfile,
  mapRef,
  townId,
  idPrefix = "openspace",
  /** Place fill/outline below this layer id (e.g. first trail layer). */
  beforeId,
  onDataChange,
  /** When true, zoom the map to the loaded open space extent (Show on map). */
  fitBoundsOnLoad = false,
  fitBoundsOptions,
}) => {
  const [openSpaceData, setOpenSpaceData] = useState(null);
  const updateTimeoutRef = useRef(null);
  const queryTimeoutRef = useRef(null);
  const fitBoundsOnLoadRef = useRef(fitBoundsOnLoad);
  const fitBoundsOptionsRef = useRef(fitBoundsOptions);
  const didFitBoundsRef = useRef(false);

  fitBoundsOnLoadRef.current = fitBoundsOnLoad;
  fitBoundsOptionsRef.current = fitBoundsOptions;

  const sourceId = `${idPrefix}-source`;
  const fillLayerId = `${idPrefix}-layer`;
  const outlineLayerId = `${idPrefix}-outline`;

  const isActive =
    showOpenSpace && (showMunicipalityProfileMap || showProjectTrailsProfile);
  const useTownApi = townId != null && townId !== "";

  // Keep open space beneath trail line layers even when toggled on late
  useEffect(() => {
    if (!isActive || !openSpaceData || !mapRef?.current) return undefined;

    const map = mapRef.current.getMap();
    if (!map) return undefined;

    const moveBelowTrails = () => {
      if (!map.getLayer(fillLayerId)) return;

      const styleLayers = map.getStyle()?.layers || [];
      const trailLayer = styleLayers.find(
        (layer) =>
          (layer.id.startsWith("geojson-trail-") ||
            layer.id === "other-regional-trails-layer" ||
            layer.id === "gaps-other-regional-trails-layer" ||
            layer.id === "major-trails-layer") &&
          !layer.id.includes("hover") &&
          !layer.id.includes("highlight") &&
          !layer.id.includes("click")
      );
      const targetBeforeId =
        (beforeId && map.getLayer(beforeId) && beforeId) ||
        (trailLayer && map.getLayer(trailLayer.id) && trailLayer.id) ||
        null;

      if (!targetBeforeId) return;

      try {
        map.moveLayer(fillLayerId, targetBeforeId);
        if (map.getLayer(outlineLayerId)) {
          map.moveLayer(outlineLayerId, targetBeforeId);
        }
      } catch (err) {
        // Layer may not be ready yet; ignore and retry via timeout below
      }
    };

    moveBelowTrails();
    const timeoutId = setTimeout(moveBelowTrails, 50);
    return () => clearTimeout(timeoutId);
  }, [
    isActive,
    openSpaceData,
    mapRef,
    fillLayerId,
    outlineLayerId,
    beforeId,
  ]);


  // Community Overview: fetch open space for selected municipality by town_id
  useEffect(() => {
    didFitBoundsRef.current = false;

    if (!isActive || !useTownApi) {
      if (useTownApi) {
        setOpenSpaceData(null);
        if (onDataChange) onDataChange(null);
      }
      return;
    }

    let cancelled = false;

    const fetchByTown = async () => {
      try {
        const { featureCollection } = await fetchOpenSpaceByTownId(townId);
        if (cancelled) return;

        setOpenSpaceData(
          featureCollection.features.length > 0 ? featureCollection : null
        );
        if (onDataChange) onDataChange(featureCollection);
        if (
          fitBoundsOnLoadRef.current &&
          !didFitBoundsRef.current &&
          featureCollection.features.length > 0
        ) {
          didFitBoundsRef.current = true;
          fitMapToOpenSpaceExtent(
            mapRef,
            featureCollection,
            fitBoundsOptionsRef.current
          );
        }
      } catch (error) {
        console.error("Error fetching open space by town:", error);
        if (!cancelled) {
          setOpenSpaceData(null);
          if (onDataChange) onDataChange(null);
        }
      }
    };

    fetchByTown();

    return () => {
      cancelled = true;
    };
  }, [isActive, useTownApi, townId, onDataChange]);

  // MassGIS viewport-based fetch (Map layers / Project Profile)
  useEffect(() => {
    if (!isActive || useTownApi || !mapRef?.current) {
      if (!useTownApi && !isActive) {
        setOpenSpaceData(null);
        if (onDataChange) onDataChange(null);
      }
      return;
    }

    const toWebMercator = (lon, lat) => {
      const x = (lon * 20037508.34) / 180;
      let y =
        Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
      y = (y * 20037508.34) / 180;
      return { x, y };
    };

    const updateLayer = () => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const mapBounds = map.getBounds();
      const sw = mapBounds.getSouthWest();
      const ne = mapBounds.getNorthEast();
      const swMerc = toWebMercator(sw.lng, sw.lat);
      const neMerc = toWebMercator(ne.lng, ne.lat);
      const bbox = `${swMerc.x},${swMerc.y},${neMerc.x},${neMerc.y}`;
      const url = `${MASSGIS_OPENSPACE_URL}/query?where=1=1&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=3857&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&f=geojson&returnGeometry=true&maxRecordCount=1000`;

      if (queryTimeoutRef.current) clearTimeout(queryTimeoutRef.current);

      queryTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const featureCollection = {
              type: "FeatureCollection",
              features: data.features,
            };
            setOpenSpaceData(featureCollection);
            if (onDataChange) onDataChange(featureCollection);
          } else {
            setOpenSpaceData(null);
            if (onDataChange) onDataChange(null);
          }
        } catch (error) {
          console.error("Error fetching OpenSpace data:", error);
          setOpenSpaceData(null);
        }
      }, 300);
    };

    updateLayer();

    const map = mapRef.current?.getMap();
    if (!map) return undefined;

    const handleMoveEnd = () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(updateLayer, 300);
    };

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleMoveEnd);
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (queryTimeoutRef.current) clearTimeout(queryTimeoutRef.current);
    };
  }, [isActive, useTownApi, mapRef, onDataChange]);

  if (!isActive || !openSpaceData) {
    return null;
  }

  // Only pass beforeId when the target layer exists — Mapbox throws if it doesn't
  // (e.g. major-trail-only mode has no "other-regional-trails-layer").
  const map = mapRef?.current?.getMap?.();
  const styleLayers = map?.getStyle?.()?.layers || [];
  const trailLayerId = styleLayers.find(
    (layer) =>
      (layer.id.startsWith("geojson-trail-") ||
        layer.id === "other-regional-trails-layer" ||
        layer.id === "gaps-other-regional-trails-layer" ||
        layer.id === "major-trails-layer") &&
      !layer.id.includes("hover") &&
      !layer.id.includes("highlight") &&
      !layer.id.includes("click")
  )?.id;
  const safeBeforeId =
    (beforeId && map?.getLayer?.(beforeId) && beforeId) ||
    trailLayerId ||
    undefined;

  return (
    <Source id={sourceId} type="geojson" data={openSpaceData}>
      <Layer
        id={fillLayerId}
        type="fill"
        beforeId={safeBeforeId}
        paint={{
          "fill-color": "#73B273",
          "fill-opacity": 0.3,
        }}
        interactive={true}
      />
      <Layer
        id={outlineLayerId}
        type="line"
        beforeId={safeBeforeId}
        paint={{
          "line-color": "#458A45",
          "line-width": 1,
          "line-opacity": 0.6,
        }}
        interactive={true}
      />
    </Source>
  );
};

export default OpenSpaceLayer;
