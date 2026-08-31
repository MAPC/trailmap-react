import { useEffect, useMemo, useState } from "react";
import * as turf from "@turf/turf";
import { parseEwkbHex } from "./parseEwkb";
import { buildMapcBoundaryData } from "./mapcBoundary";

const MUNICIPAL_BOUNDARIES_URL = `${process.env.REACT_APP_BACKEND_URL}/api/municipal-boundaries?token=trailmap&hostname=pg.mapc.org&database=gisdata&schema=mapc&table=mass_municipal_boundary`;
const SQ_METERS_PER_SQ_MILE = 2589988.110336;

export const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection",
  features: [],
};

const toGeometry = (featureOrRow) => {
  if (!featureOrRow || typeof featureOrRow !== "object") return null;

  const geom =
    featureOrRow.geometry ??
    featureOrRow.geom ??
    featureOrRow.shape ??
    featureOrRow.properties?.geometry ??
    featureOrRow.properties?.geom ??
    featureOrRow.properties?.shape;

  if (geom && typeof geom === "object" && geom.type && geom.coordinates) {
    return geom;
  }

  if (typeof geom === "string") {
    try {
      return parseEwkbHex(geom);
    } catch (error) {
      console.warn("Failed to parse municipal boundary geometry", error);
      return null;
    }
  }

  return null;
};

const getAreaSqMi = (properties, geometry) => {
  const fromProps = Number(properties?.sum_square);
  if (Number.isFinite(fromProps) && fromProps > 0) return fromProps;

  if (!geometry) return 0;

  try {
    const sqMeters = turf.area({
      type: "Feature",
      properties: {},
      geometry,
    });
    const sqMiles = sqMeters / SQ_METERS_PER_SQ_MILE;
    return Number.isFinite(sqMiles) && sqMiles > 0 ? sqMiles : 0;
  } catch (error) {
    console.warn("Failed to compute municipal area", error);
    return 0;
  }
};

const normalizeFeature = (item) => {
  if (!item) return null;

  const rawProperties = item.properties || (item.type === "Feature" ? {} : item);
  const geometry = toGeometry(item);
  if (!geometry) return null;

  const town = rawProperties.town || null;
  const townId = rawProperties.town_id;
  const normalizedTownId =
    townId == null || townId === "" ? null : Number(townId);
  const { shape, geom, geometry: _geometry, ...rest } = rawProperties;

  return {
    type: "Feature",
    geometry,
    properties: {
      ...rest,
      town,
      town_id: Number.isFinite(normalizedTownId) ? normalizedTownId : townId,
      NAME: town,
      sum_square: getAreaSqMi(rawProperties, geometry),
    },
  };
};

export const normalizeMunicipalBoundaries = (payload) => {
  if (!payload) return EMPTY_FEATURE_COLLECTION;

  if (payload.type === "FeatureCollection" && Array.isArray(payload.features)) {
    return {
      type: "FeatureCollection",
      features: payload.features.map(normalizeFeature).filter(Boolean),
    };
  }

  if (Array.isArray(payload.features)) {
    return {
      type: "FeatureCollection",
      features: payload.features.map(normalizeFeature).filter(Boolean),
    };
  }

  if (payload.geojson) {
    return normalizeMunicipalBoundaries(payload.geojson);
  }

  if (payload.data) {
    return normalizeMunicipalBoundaries(payload.data);
  }

  if (Array.isArray(payload.rows)) {
    return {
      type: "FeatureCollection",
      features: payload.rows.map(normalizeFeature).filter(Boolean),
    };
  }

  if (Array.isArray(payload)) {
    return {
      type: "FeatureCollection",
      features: payload.map(normalizeFeature).filter(Boolean),
    };
  }

  return EMPTY_FEATURE_COLLECTION;
};

let municipalBoundariesCachePromise = null;

export const fetchMunicipalBoundaries = () => {
  if (!municipalBoundariesCachePromise) {
    municipalBoundariesCachePromise = fetch(MUNICIPAL_BOUNDARIES_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Municipal boundaries API error: ${response.status}`
          );
        }
        const payload = await response.json();
        return normalizeMunicipalBoundaries(payload);
      })
      .catch((error) => {
        municipalBoundariesCachePromise = null;
        throw error;
      });
  }

  return municipalBoundariesCachePromise;
};

export const useMunicipalBoundaries = () => {
  const [data, setData] = useState(EMPTY_FEATURE_COLLECTION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchMunicipalBoundaries()
      .then((featureCollection) => {
        if (cancelled) return;
        setData(featureCollection);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        console.error("Error fetching municipal boundaries:", loadError);
        setError(loadError);
        setData(EMPTY_FEATURE_COLLECTION);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const mapcBoundaryData = useMemo(
    () => buildMapcBoundaryData(data),
    [data]
  );

  return { data, mapcBoundaryData, isLoading, error };
};
