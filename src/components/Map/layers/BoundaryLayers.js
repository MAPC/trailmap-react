import React, { useContext, useEffect } from "react";
import { Source, Layer } from "react-map-gl";
import { LayerContext } from "../../../App";
import { useMunicipalBoundaries } from "../../../utils/fetchMunicipalBoundaries";
import { attachBoundaryLayerOrder } from "../utils/boundaryLayerOrder";

const HOUSE_FILL_URL =
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/House2021/MapServer/1/query?where=1%3D1&outFields=*&f=geojson";
const HOUSE_LINES_URL =
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/House2021/MapServer/0/query?where=1%3D1&outFields=*&f=geojson";
const SENATE_FILL_URL =
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Senate2021/MapServer/1/query?where=1%3D1&outFields=*&f=geojson";
const SENATE_LINES_URL =
  "https://arcgisserver.digital.mass.gov/arcgisserver/rest/services/AGOL/Senate2021/MapServer/0/query?where=1%3D1&outFields=*&f=geojson";

/**
 * Shared boundary overlays for Regional Map, Community Profile, and Trails Profile.
 * Driven by LayerContext toggles from the Boundaries panel.
 * Always kept under trails and other map overlays.
 */
const BoundaryLayers = ({ mapRef }) => {
  const {
    showMunicipalities,
    showMapcBoundary,
    showMaHouseDistricts,
    showMaSenateDistricts,
  } = useContext(LayerContext);
  const { data: massachusettsData, mapcBoundaryData } = useMunicipalBoundaries();

  useEffect(() => {
    return attachBoundaryLayerOrder(mapRef);
  }, [
    mapRef,
    showMunicipalities,
    showMapcBoundary,
    showMaHouseDistricts,
    showMaSenateDistricts,
    massachusettsData,
    mapcBoundaryData,
  ]);

  return (
    <>
      {showMaHouseDistricts && (
        <>
          <Source id="boundary-ma-house-fill" type="geojson" data={HOUSE_FILL_URL}>
            <Layer
              id="boundary-ma-house-fill"
              type="fill"
              paint={{
                "fill-color": "transparent",
                "fill-outline-color": "transparent",
              }}
            />
          </Source>
          <Source id="boundary-ma-house-lines" type="geojson" data={HOUSE_LINES_URL}>
            <Layer
              id="boundary-ma-house-lines"
              type="line"
              paint={{
                "line-color": "#111111",
                "line-width": 1.25,
              }}
            />
          </Source>
        </>
      )}

      {showMaSenateDistricts && (
        <>
          <Source id="boundary-ma-senate-fill" type="geojson" data={SENATE_FILL_URL}>
            <Layer
              id="boundary-ma-senate-fill"
              type="fill"
              paint={{
                "fill-color": "transparent",
                "fill-outline-color": "transparent",
              }}
            />
          </Source>
          <Source id="boundary-ma-senate-lines" type="geojson" data={SENATE_LINES_URL}>
            <Layer
              id="boundary-ma-senate-lines"
              type="line"
              paint={{
                "line-color": "#111111",
                "line-width": 1.25,
              }}
            />
          </Source>
        </>
      )}

      {showMunicipalities && (
        <Source id="boundary-municipalities" type="geojson" data={massachusettsData}>
          <Layer
            id="boundary-municipalities-fill"
            type="fill"
            paint={{
              "fill-color": "transparent",
              "fill-outline-color": "transparent",
            }}
          />
          <Layer
            id="boundary-municipalities-line"
            type="line"
            paint={{
              "line-color": "#111111",
              "line-width": 1.05,
            }}
          />
        </Source>
      )}

      {showMapcBoundary && (
        <Source id="boundary-mapc" type="geojson" data={mapcBoundaryData}>
          <Layer
            id="boundary-mapc-line"
            type="line"
            paint={{
              "line-color": "black",
              "line-width": 1.05,
            }}
          />
        </Source>
      )}
    </>
  );
};

export default BoundaryLayers;
