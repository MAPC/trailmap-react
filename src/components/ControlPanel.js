import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-map-gl-geocoder/dist/mapbox-gl-geocoder.css';
import React, { useEffect, useState } from 'react';
import GeocoderControl from './GeocoderControl';
import TypeButton from './TypeButton';
const WEATHER_API = process.env.REACT_APP_WEATHER_API

const ControlPanel = React.forwardRef(({ MAPBOX_TOKEN, layerData, handleTrailLayers, trailLayers }, ref) => {

  const [weather, setWeather] = useState({ description: '', temp: '' });

  useEffect(() => {
    async function fetchData() {
      try {
        await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=42&lon=-70&units=imperial&appid=${WEATHER_API}`).then(async (resp) => {
          await resp.json().then((json) => {
            console.log('json', { description: json.weather[0].main, temp: json.main.temp });
            setWeather({ description: json.weather[0].main, temp: json.main.temp });
            return json.weather[0].main;
          });
        });
      } catch (err) {
        console.log(err);
      }
    }
    fetchData();
  }, []);

  const renderTypeButton = layerData.map((layer, index) => {
    return <TypeButton
      key={index}
      layer={layer}
      trailLayers={trailLayers}
      handleTrailLayers={handleTrailLayers} />;
  });

  return (
    <div className="ControlPanel">
      <GeocoderControl
        mapboxAccessToken={MAPBOX_TOKEN}
        position="top-left"
        ref={ref}
      />
      <div>
        <h2>Find the trails that work for you!</h2>
        <p>Select from various trail types to find trails best suited to your needs.</p>
        <p>Current Weather is: {weather.description} {weather.temp}</p>
      </div>
      <div>
        <h2>Existing:</h2>
        {renderTypeButton}
      </div>
    </div>
  );
});

export default ControlPanel;
