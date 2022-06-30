const LayerData = {
  existing: [
    {
      id: 'pavedPaths',
      label: 'Paved Shared Use Paths',
      type: 'line',
      'source-layer': 'Existing Paved Shared Use Paths',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#214A2D',
        'line-width': 2,
        'line-opacity': 1
      }

    },
    {
      id: 'unimprovedPaths',
      label: 'Unimproved Shared Use Paths',
      type: 'line',
      'source-layer': 'Existing Unimproved Shared Use Paths',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#4BAA40',
        'line-width': 2,
        'line-opacity': 1
      }

    },
    {
      id: 'bikeLane',
      label: 'Bike Lanes',
      type: 'line',
      'source-layer': 'Existing Bike Lanes',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#92C5DE',
        'line-width': 2,
        'line-opacity': 1
      }
    },
    {
      id: 'protectedBikeLane',
      label: 'Protected Bike Lanes',
      type: 'line',
      'source-layer': 'Existing Protected Bike Lanes',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#2166AC',
        'line-width': 2,
        'line-opacity': 1
      }
    },
    {
      id: 'pavedFootway',
      label: 'Paved Footway',
      type: 'line',
      'source-layer': 'Paved Footway',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#903366',
        'line-width': 2,
        'line-opacity': 1
      }

    },
    {
      id: 'naturalSurfaceFootway',
      label: 'Natural Surface Footways',
      type: 'line',
      'source-layer': 'Natural Surface Footway',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#A87196',
        'line-width': 2,
        'line-opacity': 1
      }

    }
  ],
  proposed: [
    {
      id: 'pavedPathsProposed',
      label: 'Proposed Paved Shared Use Paths',
      type: 'line',
      'source-layer': 'Proposed Paved Shared Use Paths',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#214A2D',
        'line-width': 2,
        'line-opacity': 1,
        'line-dasharray': [2, 2]
      }
    },
    {
      id: 'unimprovedPathsProposed',
      label: 'Proposed Unimproved Shared Use Paths',
      type: 'line',
      'source-layer': 'Proposed Unimproved Shared Use Paths',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#4BAA40',
        'line-width': 2,
        'line-opacity': 1,
        'line-dasharray': [2, 2]
      }
    },
    {
      id: 'protectedBikeLaneProposed',
      label: 'Proposed Protected Bike Lanes',
      type: 'line',
      'source-layer': 'Proposed Protected Bike Lanes',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#2166AC',
        'line-width': 2,
        'line-opacity': 1,
        'line-dasharray': [2, 2]
      }
    },
    {
      id: 'bikeLaneProposed',
      label: 'Proposed Bike Lanes',
      type: 'line',
      'source-layer': 'Proposed Bike Lanes',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#92C5DE',
        'line-width': 2,
        'line-opacity': 1,
        'line-dasharray': [2, 2]
      }
    },
    {
      id: 'naturalSurfaceFootwayProposed',
      label: 'Proposed Natural Surface Footway',
      type: 'line',
      'source-layer': 'Proposed Natural Surface Footway',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#A87196',
        'line-width': 2,
        'line-opacity': 1,
        'line-dasharray': [2, 2]
      }
    },
    {
      id: 'pavedFootwayProposed',
      label: 'Proposed Paved Footway',
      type: 'line',
      'source-layer': 'Proposed Paved Footway',
      layout: {
        'line-cap': 'butt',
        'line-join': 'miter'
      },
      paint: {
        'line-color': '#903366',
        'line-width': 2,
        'line-opacity': 1,
        'line-dasharray': [2, 2]
      }
    }
  ],
  basemap: [
    {
      id: 'mapboxLight',
      label: 'Light',
      url: 'mapbox://styles/mapbox/light-v10'
    },
    {
      id: 'mapboxDark',
      label: 'Dark',
      url: 'mapbox://styles/mapbox/dark-v10'
    },
    {
      id: 'terrain',
      label: 'Terrain',
      url: 'mapbox://styles/mapbox/outdoors-v11'
    },
    {
      id: 'satellite',
      label: 'Satellite',
      url: 'mapbox://sprites/mapbox/satellite-v9'
    },
    {
      id: 'satelliteSteets',
      label: 'Satellite Streets',
      url: 'mapbox://styles/mapbox/satellite-streets-v11'
    },
    {
      id: 'streets',
      label: 'Streets',
      url: 'mapbox://styles/mapbox/streets-v11'
    }
  ]
};

export default LayerData;