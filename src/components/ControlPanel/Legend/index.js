import React, { useState, useEffect } from 'react';
import LegendItem from './LegendItem';

const LANDLINE_LEGEND = process.env.REACT_APP_LANDLINE_LEGEND_URL;

const Legend = () => {
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
    <div className='Legend'>
      {legendItems}
    </div>)
}

export default Legend;