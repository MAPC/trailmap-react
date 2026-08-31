import React, { useEffect, useState, useRef } from "react";
import { Source, Layer } from "react-map-gl";
import {
  getLandlineLineStyle,
  LANDLINE_SELECTION_HIGHLIGHT,
} from "../constants/landlineFeatureStyle";
import { LANDLINES_SERVICE_URL, LANDLINE_HIT_LAYER_ID } from "../utils/landlineIdentify";

/**
 * Renders LandLine greenways from the same MapServer used for identify.
 * Filters for features where reg_name IS NOT NULL.
 */
const PAGE_SIZE = 2000;

const fetchAllLandlines = async () => {
  const features = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where: "reg_name IS NOT NULL",
      outFields: "*",
      outSR: "4326",
      f: "geojson",
      returnGeometry: "true",
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
      orderByFields: "objectid",
    });
    const response = await fetch(`${LANDLINES_SERVICE_URL}/query?${params}`);
    const data = await response.json();
    if (data?.error) {
      throw new Error(data.error.message || "LandLine query failed");
    }
    const page = data.features || [];
    features.push(...page);
    const exceeded = Boolean(data.exceededTransferLimit);
    if ((!exceeded && page.length < PAGE_SIZE) || page.length === 0) break;
    offset += page.length;
  }

  return features;
};

/**
 * Renders LandLine greenways from the live FeatureServer, colored by
 * seg_type + fac_stat (same rules as the embedded LandLine map).
 */
const LandlinesLayer = ({ showLandlines, selectedFeature }) => {
  const [landlinesData, setLandlinesData] = useState(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!showLandlines) {
      requestIdRef.current += 1;
      setLandlinesData(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    let cancelled = false;
    (async () => {
      try {
        const features = await fetchAllLandlines();
        if (cancelled || requestId !== requestIdRef.current) return;
        setLandlinesData({ type: "FeatureCollection", features });
      } catch (error) {
        console.error("Error fetching Landlines data:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showLandlines]);

  if (!showLandlines) {
    return null;
  }

  // Group features by style (seg_type, fac_stat) using embedded-map colors/status.
  const styleGroups = {};
  (landlinesData?.features || []).forEach((feature) => {
    const props = feature.properties || {};
    console.log(props);
    const segType = props.seg_type || props.SEG_TYPE;
    const facStat = props.fac_stat || props.FAC_STAT;
    const key = `${segType},${facStat}`;

    if (!styleGroups[key]) {
      styleGroups[key] = {
        ...getLandlineLineStyle(segType, facStat),
        features: [],
      };
    }
    styleGroups[key].features.push(feature);
  });

  return (
    <>
      <Source
        id="landlines-selection-highlight"
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: selectedFeature?.geometry ? [selectedFeature] : [],
        }}
      >
        <Layer
          id="landlines-selection-highlight-layer"
          type="line"
          paint={{
            "line-color": LANDLINE_SELECTION_HIGHLIGHT.color,
            "line-width": LANDLINE_SELECTION_HIGHLIGHT.width,
            "line-opacity": 1,
          }}
          layout={{
            "line-cap": "square",
            "line-join": "miter",
          }}
        />
      </Source>
      <Source
        id="landlines-hit"
        type="geojson"
        data={landlinesData || { type: "FeatureCollection", features: [] }}
      >
        <Layer
          id={LANDLINE_HIT_LAYER_ID}
          type="line"
          paint={{
            "line-color": "#000000",
            "line-width": 16,
              "line-opacity": 0.01,
          }}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
        />
      </Source>
      {Object.entries(styleGroups).map(([key, style]) => (
        <Source
          key={`landlines-${key}`}
          id={`landlines-source-${key}`}
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: style.features,
          }}
        >
          <Layer
            id={`landlines-layer-${key}-outline`}
            type="line"
            paint={{
              "line-color": style.outline.color,
              "line-width": style.outline.width,
              "line-opacity": 0.9,
              ...(style.outline.dashArray
                ? { "line-dasharray": style.outline.dashArray }
                : {}),
            }}
            layout={{
              "line-cap": "round",
              "line-join": "round",
            }}
          />
          {style.overlay && (
            <Layer
              id={`landlines-layer-${key}-overlay`}
              type="line"
              paint={{
                "line-color": style.overlay.color,
                "line-width": style.overlay.width,
                "line-opacity": 1,
                ...(style.overlay.dashArray
                  ? { "line-dasharray": style.overlay.dashArray }
                  : {}),
              }}
              layout={{
                "line-cap": "round",
                "line-join": "round",
              }}
            />
          )}
        </Source>
      ))}
    </>
  );
};

export default LandlinesLayer;

