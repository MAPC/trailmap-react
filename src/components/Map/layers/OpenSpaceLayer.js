import React, { useEffect, useRef } from "react";
import { Source, Layer } from "react-map-gl";

/**
 * Renders OpenSpace (Protected and Recreational OpenSpace) layer using Mapbox Vector Tileset
 * Tileset ID: ihill.7fjeze3n
 */
const OPENSPACE_TILESET_ID = "ihill.7fjeze3n";
const OPENSPACE_SOURCE_LAYER = "Protected_and_Recreational_Op-98eeg1";

const OpenSpaceLayer = ({ showOpenSpace, showMunicipalityProfileMap, showRegionalTrailsProfile, mapRef }) => {
  // Use different source IDs for different pages to avoid conflicts
  const sourceId = showMunicipalityProfileMap ? "openspace-source-community" : "openspace-source-regional";
  const fillLayerId = showMunicipalityProfileMap ? "openspace-layer-community" : "openspace-layer-regional";
  const outlineLayerId = showMunicipalityProfileMap ? "openspace-outline-community" : "openspace-outline-regional";
  const otherSourceId = showMunicipalityProfileMap ? "openspace-source-regional" : "openspace-source-community";
  const otherFillLayerId = showMunicipalityProfileMap ? "openspace-layer-regional" : "openspace-layer-community";
  const otherOutlineLayerId = showMunicipalityProfileMap ? "openspace-outline-regional" : "openspace-outline-community";

  // Clean up the other page's source and layers when this component mounts
  useEffect(() => {
    if (!mapRef?.current) return;
    
    const map = mapRef.current.getMap();
    if (!map) return;

    const cleanupOtherPage = () => {
      // Wait for style to load before cleaning up
      if (!map.isStyleLoaded()) {
        map.once('styledata', cleanupOtherPage);
        return;
      }

      // Remove the other page's layers and source if they exist
      try {
        // Remove other page's layers first
        if (map.getLayer(otherFillLayerId)) {
          map.removeLayer(otherFillLayerId);
        }
        if (map.getLayer(otherOutlineLayerId)) {
          map.removeLayer(otherOutlineLayerId);
        }
        
        // Remove other page's source
        if (map.getSource(otherSourceId)) {
          map.removeSource(otherSourceId);
        }
      } catch (err) {
        // Source or layer might not exist, which is fine
      }
    };

    // Small delay to ensure current page's layers are added first
    const timeoutId = setTimeout(cleanupOtherPage, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (map && map.off) {
        map.off('styledata', cleanupOtherPage);
      }
    };
  }, [mapRef, otherSourceId, otherFillLayerId, otherOutlineLayerId]);

  if (!showOpenSpace || (!showMunicipalityProfileMap && !showRegionalTrailsProfile)) {
    return null;
  }

  // Mapbox tileset URL format: mapbox://tileset-id
  const tilesetUrl = `mapbox://${OPENSPACE_TILESET_ID}`;

  return (
    <Source
      id={sourceId}
      type="vector"
      url={tilesetUrl}
    >
      {/* OpenSpace polygon fill layer */}
      <Layer
        id={fillLayerId}
        type="fill"
        source-layer={OPENSPACE_SOURCE_LAYER}
        paint={{
          "fill-color": "#73B273",
          "fill-opacity": 0.5
        }}
        interactive={true}
      />
      {/* OpenSpace outline line layer */}
      <Layer
        id={outlineLayerId}
        type="line"
        source-layer={OPENSPACE_SOURCE_LAYER}
        paint={{
          "line-color": "#458A45",
          "line-width": 1,
          "line-opacity": 0.8
        }}
        layout={{
          "line-join": "round"
        }}
        interactive={true}
      />
    </Source>
  );
};

export default OpenSpaceLayer;
