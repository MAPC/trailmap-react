import React, { useState, useEffect, useContext } from 'react';
import LegendItem from './LegendItem';
import { LayerContext } from "../../../App";

const LANDLINE_LEGEND = process.env.REACT_APP_LANDLINE_LEGEND_URL;

const Legend = () => {
  const { showLandlineLayer } = useContext(LayerContext);
  const [legendItems, setLegendItems] = useState([]);

  useEffect(() => {
    fetch(LANDLINE_LEGEND)
      .then((response) => response.json())
      .then((data) => {
        const legendItems = data.layers[0].legend.map((legendItem, index) => {
          return (<LegendItem
            key={index}
            imageSrc={legendItem.url}
            label={legendItem.label} />);
        });
        setLegendItems(legendItems);
      });
  }, [])

  return (
    <div className='Legend'
      style={showLandlineLayer ? {} : { display: 'none' }}>
      {legendItems}
    </div>)
}

export default Legend;