import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMapGL, { NavigationControl, ScaleControl, Source } from "react-map-gl";
import bbox from "@turf/bbox";
import LoadingBar from "../LoadingBar";
import CollapsibleTrailLegend from "../Map/CollapsibleTrailLegend";
import TrailLegend from "../Map/TrailLegend";
import CommunityTrailsProfileLayers from "../Map/layers/CommunityTrailsProfileLayers";
import MunicipalityMapLayer from "../Map/layers/MunicipalityMapLayer";
import { mapcTrailLayers } from "../Map/constants/mapcTrailLayersConfig";
import { queryMunicipalityTrails } from "../Map/utils/trailQueries";
import EmbedTrailPopup from "./EmbedTrailPopup";
import { useMunicipalBoundaries } from "../../utils/fetchMunicipalBoundaries";
import {
  capitalizeWords,
  findMunicipalityTrailMetricsByTownId,
  formatMiles,
  getCommunityProfilePath,
} from "../../utils/trailMetricsDashboard";
import {
  buildTrailStatsFromMetricsRow,
  emptyTrailStats,
  formatFeetAsMiles,
  getTrailTypeStatusRows,
} from "../../utils/communityProfileStats";
import TrailmapLogo from "../../assets/MAPC_logo.svg";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
const LIGHT_MAP_STYLE = "mapbox://styles/mapbox/light-v10";

const DEFAULT_VIEWPORT = {
  latitude: 42.3772,
  longitude: -71.0244,
  zoom: 9,
};

const STACK_BREAKPOINT = 720;
const DEFAULT_TABLE_SHARE = 0.34;
const MIN_MAP_PX = 160;
const MIN_TABLE_PX = 180;
const SPLIT_STEP = 0.03;

const parseTrailLayerId = (layerId) =>
  parseInt(
    String(layerId || "")
      .replace("geojson-trail-hover-", "")
      .replace("geojson-trail-", ""),
    10
  );

const isTrailMapLayerId = (layerId) =>
  Boolean(layerId?.startsWith("geojson-trail-") && layerId !== "highlighted-trail");

const findTrailFromFeature = (feature, trails) => {
  const layerId = parseTrailLayerId(feature?.layer?.id);
  if (!Number.isFinite(layerId)) return null;

  const clickedObjectId =
    feature.properties?.objectid ?? feature.properties?.OBJECTID;
  const matchedTrail = trails.find((trail) => {
    const trailObjectId =
      trail.attributes?.objectid ?? trail.attributes?.OBJECTID;
    return (
      trail.layerId === layerId &&
      String(trailObjectId) === String(clickedObjectId)
    );
  });
  if (matchedTrail) return matchedTrail;

  const layer = mapcTrailLayers.find((item) => item.id === layerId);
  return {
    layerId,
    layerName: layer?.name || "Trail",
    attributes: feature.properties || {},
    color: layer?.color,
    feature,
  };
};

const getClickedTrails = (features, trails) => {
  const seen = new Set();
  const results = [];

  (features || []).forEach((feature) => {
    if (!isTrailMapLayerId(feature.layer?.id)) return;
    const trail = findTrailFromFeature(feature, trails);
    if (!trail) return;
    const objectId =
      trail.attributes?.objectid ?? trail.attributes?.OBJECTID ?? "";
    const key = `${trail.layerId}-${objectId}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(trail);
  });

  return results;
};

const initialTrailVisibility = () => {
  const visibility = {};
  mapcTrailLayers.forEach((layer) => {
    visibility[layer.id] = true;
  });
  return visibility;
};

const CommunityProfileEmbed = () => {
  const [searchParams] = useSearchParams();
  const muniSlug = (searchParams.get("muni") || "").trim().toLowerCase();
  const mapRef = useRef();
  const lastQueriedMunicipality = useRef(null);
  const { data: massachusettsData, isLoading: isLoadingBoundaries } =
    useMunicipalBoundaries();

  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [trails, setTrails] = useState([]);
  const [trailStats, setTrailStats] = useState(null);
  const [isQueryingTrails, setIsQueryingTrails] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [metricsError, setMetricsError] = useState(null);
  const [visibleTrailTypes, setVisibleTrailTypes] = useState(initialTrailVisibility);
  const [hoveredTrail, setHoveredTrail] = useState(null);
  const [highlightedTrail, setHighlightedTrail] = useState(null);
  const [identifyPoint, setIdentifyPoint] = useState(null);
  const [identifyTrails, setIdentifyTrails] = useState([]);
  const [identifyIndex, setIdentifyIndex] = useState(0);
  const [tableShare, setTableShare] = useState(DEFAULT_TABLE_SHARE);
  const [isStacked, setIsStacked] = useState(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const bodyRef = useRef(null);
  const isDraggingSplitRef = useRef(false);

  const selectedMunicipality = useMemo(() => {
    if (!muniSlug || !massachusettsData?.features?.length) return null;
    const feature = massachusettsData.features.find((item) => {
      const town = item.properties?.town || item.properties?.NAME;
      return town && town.toLowerCase() === muniSlug;
    });
    if (!feature) return null;
    return {
      name: (feature.properties.town || feature.properties.NAME).toLowerCase(),
      properties: feature.properties,
      geometry: feature.geometry,
    };
  }, [massachusettsData, muniSlug]);

  const municipalityName = selectedMunicipality
    ? capitalizeWords(selectedMunicipality.name)
    : capitalizeWords(muniSlug);
  const sourcePath = getCommunityProfilePath(muniSlug);
  const sourceUrl = `${window.location.origin}${sourcePath}`;
  const trailTypeStatusRows = getTrailTypeStatusRows(trailStats);

  useEffect(() => {
    if (!selectedMunicipality) {
      setTrails([]);
      lastQueriedMunicipality.current = null;
      setIdentifyPoint(null);
      setIdentifyTrails([]);
      setHighlightedTrail(null);
      setHoveredTrail(null);
      return;
    }

    queryMunicipalityTrails({
      municipality: selectedMunicipality,
      location: null,
      setIsQueryingTrails,
      setLoadingProgress,
      setLoadingMessage,
      setMunicipalityTrails: setTrails,
      setIntersectedTrails: () => {},
      lastQueriedMunicipality,
    });
  }, [selectedMunicipality]);

  useEffect(() => {
    const townId = selectedMunicipality?.properties?.town_id;
    if (!selectedMunicipality || townId == null) {
      setTrailStats(null);
      setIsLoadingMetrics(false);
      setMetricsError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingMetrics(true);
    setTrailStats(null);
    setMetricsError(null);

    findMunicipalityTrailMetricsByTownId(townId)
      .then((row) => {
        if (cancelled) return;
        setTrailStats(buildTrailStatsFromMetricsRow(row));
      })
      .catch((error) => {
        console.error("Error loading embed trail metrics:", error);
        if (!cancelled) {
          setTrailStats(emptyTrailStats());
          setMetricsError("Could not load trail network details.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMetrics(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMunicipality]);

  const fitToMunicipality = (municipality) => {
    if (!municipality?.geometry || !mapRef.current?.getMap) return;
    try {
      const [minLng, minLat, maxLng, maxLat] = bbox(municipality.geometry);
      const map = mapRef.current.getMap();
      if (!map) return;
      const canvas = map.getCanvas?.();
      const size = Math.min(canvas?.clientWidth || 0, canvas?.clientHeight || 0);
      const padding = size > 0 ? Math.max(8, Math.min(40, Math.floor(size * 0.08))) : 16;
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding, duration: 800 }
      );
    } catch (error) {
      console.error("Error zooming embed map to municipality:", error);
    }
  };

  useEffect(() => {
    if (!selectedMunicipality?.geometry) return;
    const timer = window.setTimeout(() => {
      fitToMunicipality(selectedMunicipality);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [selectedMunicipality]);

  const closeTrailPopup = () => {
    setIdentifyPoint(null);
    setIdentifyTrails([]);
    setIdentifyIndex(0);
    setHighlightedTrail(null);
  };

  const handleMapClick = (event) => {
    const map = mapRef.current?.getMap?.();
    let features = event.features || [];

    if (features.length === 0 && map && event.point) {
      const pad = 12;
      const box = [
        [event.point.x - pad, event.point.y - pad],
        [event.point.x + pad, event.point.y + pad],
      ];
      const layerIds = mapcTrailLayers
        .flatMap((layer) => [
          `geojson-trail-${layer.id}`,
          `geojson-trail-hover-${layer.id}`,
        ])
        .filter((id) => map.getLayer(id));
      if (layerIds.length > 0) {
        features = map.queryRenderedFeatures(box, { layers: layerIds });
      }
    }

    const clickedTrails = getClickedTrails(features, trails);
    if (clickedTrails.length === 0) {
      closeTrailPopup();
      return;
    }

    const popupCoords =
      event.lngLat &&
      !Number.isNaN(event.lngLat.lng) &&
      !Number.isNaN(event.lngLat.lat)
        ? { lng: event.lngLat.lng, lat: event.lngLat.lat }
        : null;

    if (!popupCoords) return;

    setHighlightedTrail(clickedTrails[0]);
    setIdentifyIndex(0);
    setIdentifyTrails(clickedTrails);
    setIdentifyPoint(popupCoords);
  };

  const handleMapMouseMove = (event) => {
    const trailFeature = (event.features || []).find((feature) =>
      isTrailMapLayerId(feature.layer?.id)
    );
    if (!trailFeature) {
      setHoveredTrail(null);
      return;
    }
    setHoveredTrail(findTrailFromFeature(trailFeature, trails));
  };

  const handleToggleTrailType = (layerId) => {
    setVisibleTrailTypes((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const resizeMap = () => {
    mapRef.current?.getMap?.()?.resize();
  };

  const clampTableShare = (share, size) => {
    if (!size) return DEFAULT_TABLE_SHARE;
    const minTable = MIN_TABLE_PX / size;
    const maxTable = 1 - MIN_MAP_PX / size;
    if (maxTable <= minTable) return 0.5;
    return Math.min(maxTable, Math.max(minTable, share));
  };

  const updateTableShareFromPointer = (clientX, clientY) => {
    const node = bodyRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const stacked = rect.width < STACK_BREAKPOINT;
    const size = stacked ? rect.height : rect.width;
    const offset = stacked ? clientY - rect.top : clientX - rect.left;
    setTableShare(clampTableShare(1 - offset / size, size));
  };

  const isLoading =
    Boolean(muniSlug) &&
    (isLoadingBoundaries || isQueryingTrails || isLoadingMetrics);

  const unknownMunicipality =
    Boolean(muniSlug) && !isLoadingBoundaries && !selectedMunicipality;

  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return undefined;

    const updateOrientation = () => {
      const nextStacked = node.clientWidth < STACK_BREAKPOINT;
      setIsStacked((prev) => (prev === nextStacked ? prev : nextStacked));
      resizeMap();
    };

    updateOrientation();
    const observer = new ResizeObserver(updateOrientation);
    observer.observe(node);
    return () => observer.disconnect();
  }, [muniSlug, selectedMunicipality, unknownMunicipality]);

  useEffect(() => {
    resizeMap();
  }, [tableShare, isStacked]);

  const handleSplitterPointerDown = (event) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (error) {
      // Capture is optional; window listeners keep the drag going.
    }
    isDraggingSplitRef.current = true;
    setIsDraggingSplit(true);
    updateTableShareFromPointer(event.clientX, event.clientY);
  };

  const handleSplitterPointerMove = (event) => {
    if (!isDraggingSplitRef.current) return;
    updateTableShareFromPointer(event.clientX, event.clientY);
  };

  const stopDraggingSplit = () => {
    if (!isDraggingSplitRef.current) return;
    isDraggingSplitRef.current = false;
    setIsDraggingSplit(false);
    resizeMap();
  };

  const handleSplitterPointerUp = (event) => {
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch (error) {
      // Ignore release failures from synthetic or ended pointers.
    }
    stopDraggingSplit();
  };

  useEffect(() => {
    if (!isDraggingSplit) return undefined;

    const onMove = (event) => {
      if (!isDraggingSplitRef.current) return;
      updateTableShareFromPointer(event.clientX, event.clientY);
    };
    const onUp = () => stopDraggingSplit();

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDraggingSplit]);

  const handleSplitterKeyDown = (event) => {
    const node = bodyRef.current;
    const size = isStacked ? node?.clientHeight : node?.clientWidth;
    const growTable =
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp" ||
      event.key === "Home";
    const shrinkTable =
      event.key === "ArrowRight" ||
      event.key === "ArrowDown" ||
      event.key === "End";

    if (!growTable && !shrinkTable) return;
    event.preventDefault();

    if (event.key === "Home") {
      setTableShare(clampTableShare(1, size));
      return;
    }
    if (event.key === "End") {
      setTableShare(clampTableShare(0, size));
      return;
    }

    const delta = growTable ? SPLIT_STEP : -SPLIT_STEP;
    setTableShare((current) => clampTableShare(current + delta, size));
  };

  return (
    <div className="CommunityProfileEmbed">
      <LoadingBar
        isLoading={isLoading}
        progress={isQueryingTrails ? loadingProgress : 0}
        message={
          isQueryingTrails
            ? loadingMessage || "Loading trail data..."
            : municipalityName
              ? `Loading ${municipalityName}...`
              : "Loading..."
        }
      />

      <header className="CommunityProfileEmbed__header">
        <div className="CommunityProfileEmbed__brand">
          <img
            src={TrailmapLogo}
            alt="Metropolitan Area Planning Council"
            className="CommunityProfileEmbed__logo"
          />
          <div>
            <p className="CommunityProfileEmbed__eyebrow">Trailmap community profile</p>
            <h1 className="CommunityProfileEmbed__title">
              {municipalityName || "Community profile"}
            </h1>
          </div>
        </div>
        {muniSlug && (
          <a
            className="CommunityProfileEmbed__source"
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Source: view on Trailmap
            <i className="fas fa-external-link-alt" aria-hidden="true" />
          </a>
        )}
      </header>

      {!muniSlug ? (
        <div className="CommunityProfileEmbed__empty">
          Choose a community profile on Trailmap and use Embed this profile to
          generate a link.
        </div>
      ) : unknownMunicipality ? (
        <div className="CommunityProfileEmbed__empty">
          No community profile was found for “{capitalizeWords(muniSlug)}”.
        </div>
      ) : (
        <div
          ref={bodyRef}
          className={`CommunityProfileEmbed__body${
            isStacked ? " CommunityProfileEmbed__body--stacked" : ""
          }${isDraggingSplit ? " CommunityProfileEmbed__body--dragging" : ""}`}
        >
          <div className="CommunityProfileEmbed__map">
            <ReactMapGL
              ref={mapRef}
              {...viewport}
              width="100%"
              height="100%"
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle={LIGHT_MAP_STYLE}
              cursor={hoveredTrail ? "pointer" : "grab"}
              scrollZoom
              onMove={(event) => setViewport(event.viewState)}
              onLoad={() => fitToMunicipality(selectedMunicipality)}
              onClick={handleMapClick}
              onMouseMove={handleMapMouseMove}
              onMouseLeave={() => setHoveredTrail(null)}
              interactiveLayerIds={mapcTrailLayers.flatMap((layer) => [
                `geojson-trail-${layer.id}`,
                `geojson-trail-hover-${layer.id}`,
              ])}
            >
              <Source id="municipalities" type="geojson" data={massachusettsData}>
                <MunicipalityMapLayer
                  showMunicipalityProfileMap
                  selectedMunicipality={selectedMunicipality}
                />
              </Source>
              <CommunityTrailsProfileLayers
                showMunicipalityProfileMap
                intersectedTrails={trails}
                hoveredTrail={hoveredTrail}
                highlightedTrail={highlightedTrail}
                visibleTrailTypes={visibleTrailTypes}
              />
              {identifyPoint && identifyTrails.length > 0 && (
                <EmbedTrailPopup
                  point={identifyPoint}
                  trails={identifyTrails}
                  index={identifyIndex}
                  onClose={closeTrailPopup}
                  onIndexChange={(nextIndex) => {
                    setIdentifyIndex(nextIndex);
                    setHighlightedTrail(identifyTrails[nextIndex] || null);
                  }}
                />
              )}
              <ScaleControl position="bottom-right" />
              <NavigationControl position="bottom-right" showCompass={false} />
              <CollapsibleTrailLegend
                className="MapTrailLegend--embed"
                controlPanelOpen={false}
                defaultOpen
              >
                <TrailLegend
                  visibleTrailTypes={visibleTrailTypes}
                  onToggleTrailType={handleToggleTrailType}
                  hideHeader
                />
              </CollapsibleTrailLegend>
            </ReactMapGL>
          </div>

          <button
            type="button"
            className="CommunityProfileEmbed__splitter"
            aria-orientation={isStacked ? "horizontal" : "vertical"}
            aria-label="Resize map and table"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(tableShare * 100)}
            title="Drag to resize map and table"
            onPointerDown={handleSplitterPointerDown}
            onPointerMove={handleSplitterPointerMove}
            onPointerUp={handleSplitterPointerUp}
            onPointerCancel={handleSplitterPointerUp}
            onKeyDown={handleSplitterKeyDown}
          >
            <span className="CommunityProfileEmbed__splitterGrip" aria-hidden="true" />
          </button>

          <aside
            className="CommunityProfileEmbed__tablePane"
            style={{ flex: `0 0 ${tableShare * 100}%` }}
          >
            <div className="CommunityProfileEmbed__tableHeader">
              <h2>Trail network details</h2>
              {trailStats && (
                <p>
                  {formatFeetAsMiles(trailStats.existingLength)} existing mi
                  {trailStats.density != null
                    ? ` · ${formatMiles(trailStats.density)} mi/mi²`
                    : ""}
                </p>
              )}
            </div>

            {metricsError && (
              <p className="CommunityProfileEmbed__tableNote">{metricsError}</p>
            )}

            {!metricsError && trailTypeStatusRows.length > 0 ? (
              <div className="CommunityProfileEmbed__tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Trail type</th>
                      <th scope="col">Existing</th>
                      <th scope="col">Planned</th>
                      <th scope="col">Proposed</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trailTypeStatusRows.map((row) => (
                      <tr key={row.label}>
                        <td>
                          <span
                            className="CommunityProfileEmbed__swatch"
                            style={{ backgroundColor: row.color }}
                            aria-hidden="true"
                          />
                          {row.label}
                        </td>
                        <td>{formatFeetAsMiles(row.existing)}</td>
                        <td>{formatFeetAsMiles(row.planned)}</td>
                        <td>{formatFeetAsMiles(row.proposed)}</td>
                        <td>{formatFeetAsMiles(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="CommunityProfileEmbed__tableNote">Lengths in miles</p>
              </div>
            ) : (
              !isLoadingMetrics &&
              !metricsError && (
                <p className="CommunityProfileEmbed__tableNote">
                  No trail network details are available for this community.
                </p>
              )
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default CommunityProfileEmbed;
