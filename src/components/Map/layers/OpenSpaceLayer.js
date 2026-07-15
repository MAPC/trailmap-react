import React, { useEffect, useState, useRef } from "react";
import { Source, Layer } from "react-map-gl";
import { fetchOpenSpaceByTownId } from "../../../utils/fetchOpenSpace";

const MASSGIS_OPENSPACE_URL =
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/openspace/FeatureServer/0";

/**
 * Protected / recreational open space layer.
 *
 * When townId is provided (Overview "Show on map"): fetch by town from local API.
 * Otherwise (Map layers toggle / Project Profile): MassGIS viewport query.
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
}) => {
  const [openSpaceData, setOpenSpaceData] = useState(null);
  const updateTimeoutRef = useRef(null);
  const queryTimeoutRef = useRef(null);

  const sourceId = `${idPrefix}-source`;
  const fillLayerId = `${idPrefix}-layer`;
  const outlineLayerId = `${idPrefix}-outline`;

  const isActive =
    showOpenSpace && (showMunicipalityProfileMap || showProjectTrailsProfile);
  const useTownApi = townId != null;

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
          layer.id.startsWith("geojson-trail-") &&
          !layer.id.includes("hover") &&
          !layer.id.includes("highlight")
      );
      const targetBeforeId =
        (trailLayer && map.getLayer(trailLayer.id) && trailLayer.id) ||
        (beforeId && map.getLayer(beforeId) && beforeId) ||
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

  return (
    <Source id={sourceId} type="geojson" data={openSpaceData}>
      <Layer
        id={fillLayerId}
        type="fill"
        beforeId={beforeId}
        paint={{
          "fill-color": "#73B273",
          "fill-opacity": 0.3,
        }}
        interactive={true}
      />
      <Layer
        id={outlineLayerId}
        type="line"
        beforeId={beforeId}
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
