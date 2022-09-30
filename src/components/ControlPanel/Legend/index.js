import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import LegendItem from './LegendItem';
import { LayerContext } from "../../../App";

const LANDLINE_LEGEND = process.env.REACT_APP_LANDLINE_LEGEND_URL;

const Legend = () => {
  const { showLandlineLayer } = useContext(LayerContext);
  const [legendItems, setLegendItems] = useState([]);

  useEffect(() => {
    axios(LANDLINE_LEGEND)
      .then((res) => {
        const legendItems = res.data.layers[0].legend.map((legendItem, index) => {
          return (<LegendItem
            key={index}
            imageSrc={legendItem.url}
            label={legendItem.label} />);
        });
        setLegendItems(legendItems);
      });
  }, []);

  return (
    <div className='Legend pb-4'
      style={showLandlineLayer ? {} : { display: 'none' }}>
      {legendItems}
    </div>);
};

export default Legend;