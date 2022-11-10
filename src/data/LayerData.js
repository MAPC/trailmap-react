const LayerData = {
  existing: [
    {
      id: 'pavedPaths',
      'esri-id': 8,
      label: 'Paved Shared Use',
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
      'esri-id': 10,
      label: 'Unimproved Shared Use',
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
      'esri-id': 2,
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
      'esri-id': 0,
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
      'esri-id': 4,
      label: 'Paved Foot Path',
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
      'esri-id': 6,
      label: 'Natural Surface Path',
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
      'esri-id': 9,
      label: 'Planned Paved Shared Use',
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
      'esri-id': 11,
      label: 'Planned Unimproved Shared Use',
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
      id: 'bikeLaneProposed',
      'esri-id': 3,
      label: 'Planned Bike Lanes',
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
      id: 'protectedBikeLaneProposed',
      'esri-id': 1,
      label: 'Planned Protected Bike Lanes',
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
      id: 'pavedFootwayProposed',
      'esri-id': 5,
      label: 'Planned Paved Foot Path',
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
    },
    {
      id: 'naturalSurfaceFootwayProposed',
      'esri-id': 7,
      label: 'Planned Natural Surface Path',
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
    }
  ],
  landline: [
    {
      "id": "Facility Type/Shared Use Path - Existing",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        0
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#00A884",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Shared Use Path - Design/0",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        1
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FFFFFF",
        "line-dasharray": [
          1.47059,
          1.47059
        ],
        "line-width": 1.5
      }
    },
    {
      "id": "Facility Type/Shared Use Path - Design/1",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        1
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#00A884",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Shared Use Path - Envisioned",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        2
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#00A884",
        "line-dasharray": [
          1.5,
          2
        ],
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Shared Use Path - Unimproved Surface",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        3
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#C7D79E",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Protected Bike Lane and Sidewalk/0",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        4
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FFFFFF",
        "line-width": 1.5
      }
    },
    {
      "id": "Facility Type/Protected Bike Lane and Sidewalk/1",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        4
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#0070FF",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Protected Bike Lane - Design or Construction/0",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        5
      ],
      "layout": {

      },
      "paint": {
        "line-color": "#FFFFFF",
        "line-width": 1
      }
    },
    {
      "id": "Facility Type/Protected Bike Lane - Design or Construction/1",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        5
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FFFFFF",
        "line-dasharray": [
          1.47059,
          1.47059
        ],
        "line-width": 2
      }
    },
    {
      "id": "Facility Type/Protected Bike Lane - Design or Construction/2",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        5
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#0070FF",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Bike Lane and Sidewalk",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        6
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#73B2FF",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Bike Lane - Design or Construction/0",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        7
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FFFFFF",
        "line-dasharray": [
          1.30769,
          1.30769
        ],
        "line-width": 1.5
      }
    },
    {
      "id": "Facility Type/Bike Lane - Design or Construction/1",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        7
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#73B2FF",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Shared Street - Urban/0",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        8
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FFFFFF",
        "line-width": 1
      }
    },
    {
      "id": "Facility Type/Shared Street - Urban/1",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        8
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#D7C29E",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Shared Street - Suburban",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        9
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#D7C29E",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Shared Street - Envisioned",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        10
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#D7C29E",
        "line-dasharray": [
          1.66667,
          1
        ],
        "line-width": 3,
        "line-offset": -1.06667
      }
    },
    {
      "id": "Facility Type/Gap - Facility Type TBD",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        11
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FFED7F",
        "line-dasharray": [
          2,
          2
        ],
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Foot Trail - Natural Surface",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        12
      ],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FF5500",
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Foot Trail - Envisioned Natural Surface",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        13
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FF5500",
        "line-dasharray": [
          2.5,
          1.5
        ],
        "line-width": 3
      }
    },
    {
      "id": "Facility Type/Foot Trail - Roadway Section/0",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        14
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FF5500",
        "line-width": 1.5,
        "line-offset": 2.66667
      }
    },
    {
      "id": "Facility Type/Foot Trail - Roadway Section/1",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        14
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FF5500",
        "line-width": 1.5,
        "line-offset": -1.73333
      }
    },
    {
      "id": "Facility Type/Foot Trail - Envisioned Roadway Section/0",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        15
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FF5500",
        "line-dasharray": [
          4.16667,
          4.16667
        ],
        "line-width": 1.5,
        "line-offset": 2.66667
      }
    },
    {
      "id": "Facility Type/Foot Trail - Envisioned Roadway Section/1",
      "type": "line",
      "source": "esri",
      "source-layer": "Facility Type",
      "filter": [
        "==",
        "_symbol",
        15
      ],
      "layout": {
        "line-join": "round"
      },
      "paint": {
        "line-color": "#FF5500",
        "line-dasharray": [
          4.16667,
          4.16667
        ],
        "line-width": 3,
        "line-offset": -1.53333
      }
    }
  ],
  basemap: [
    {
      id: 'terrain',
      label: 'Terrain',
      url: 'mapbox://styles/mapbox/outdoors-v11'
    },
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
