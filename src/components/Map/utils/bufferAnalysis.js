import * as turf from "@turf/turf";

/**
 * Calculate features within buffer radius
 */
export const calculateBufferAnalysis = (
  center, 
  radius, 
  intersectedTrails,
  commuterRailStationsData,
  blueBikeStationsData,
  subwayStationsData
) => {
  if (!center || !radius) return null;

  const centerPoint = turf.point([center.lng, center.lat]);
  const bufferCircle = turf.circle(centerPoint, radius / 1000, { units: 'kilometers' });

  const results = {
    trails: [],
    stations: [],
    bikeStations: [],
    subwayStations: []
  };

  // Check trails
  if (intersectedTrails && intersectedTrails.length > 0) {
    intersectedTrails.forEach((trail) => {
      if (trail.geometry) {
        const trailFeature = {
          type: 'Feature',
          geometry: trail.geometry,
          properties: trail.attributes
        };

        // Check if trail intersects with buffer
        const intersects = turf.booleanIntersects(bufferCircle, trailFeature);
        
        if (intersects) {
          // Calculate distance from center to trail
          let distance = 0;
          
          // Handle MultiLineString by converting to LineString or calculating min distance
          if (trail.geometry.type === 'MultiLineString') {
            // For MultiLineString, find the closest segment
            let minDistance = Infinity;
            trail.geometry.coordinates.forEach((lineCoords) => {
              const lineString = turf.lineString(lineCoords);
              const d = turf.pointToLineDistance(centerPoint, lineString, { units: 'meters' });
              if (d < minDistance) {
                minDistance = d;
              }
            });
            distance = minDistance;
          } else {
            // For LineString, calculate directly
            distance = turf.pointToLineDistance(centerPoint, trailFeature, { units: 'meters' });
          }
          
          // Get trail length
          const lengthInFeet = trail.attributes?.length_ft || 
                               trail.attributes?.['Facility Length in Feet'] || 
                               trail.attributes?.Shape_Length || 
                               0;
          
          results.trails.push({
            name: trail.attributes?.Name || trail.attributes?.name || 'Unnamed Trail',
            type: trail.layerName || 'Unknown',
            distance: distance,
            length: Number(lengthInFeet) * 0.3048, // Convert feet to meters
            color: trail.color
          });
        }
      }
    });

    // Sort trails by distance
    results.trails.sort((a, b) => a.distance - b.distance);
  }

  // Check commuter rail stations
  if (commuterRailStationsData && commuterRailStationsData.features) {
    commuterRailStationsData.features.forEach((station) => {
      const stationPoint = turf.point(station.geometry.coordinates);
      const distance = turf.distance(centerPoint, stationPoint, { units: 'meters' });

      if (distance <= radius) {
        results.stations.push({
          name: station.properties?.station || 'Unknown Station',
          line: station.properties?.line_brnch || 'Unknown Line',
          distance: distance
        });
      }
    });

    // Sort stations by distance
    results.stations.sort((a, b) => a.distance - b.distance);
  }

  // Check Blue Bike stations
  if (blueBikeStationsData && blueBikeStationsData.features) {
    blueBikeStationsData.features.forEach((station) => {
      const stationPoint = turf.point(station.geometry.coordinates);
      const distance = turf.distance(centerPoint, stationPoint, { units: 'meters' });

      if (distance <= radius) {
        results.bikeStations.push({
          name: station.properties?.Name || 'Unknown Station',
          district: station.properties?.District || 'Unknown District',
          totalDocks: station.properties?.Total_docks || 0,
          distance: distance
        });
      }
    });

    // Sort bike stations by distance
    results.bikeStations.sort((a, b) => a.distance - b.distance);
  }

  // Check Subway stations
  if (subwayStationsData && subwayStationsData.stations && subwayStationsData.stations.features) {
    subwayStationsData.stations.features.forEach((station) => {
      const stationPoint = turf.point(station.geometry.coordinates);
      const distance = turf.distance(centerPoint, stationPoint, { units: 'meters' });

      if (distance <= radius) {
        results.subwayStations.push({
          name: station.properties?.STATION || 'Unknown Station',
          line: station.properties?.LINE || 'Unknown Line',
          distance: distance
        });
      }
    });

    // Sort subway stations by distance
    results.subwayStations.sort((a, b) => a.distance - b.distance);
  }

  return results;
};

