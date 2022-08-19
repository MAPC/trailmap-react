import React, { useEffect } from 'react';

const LegendItem = ({ imageSrc, label }) => {

  return (
    <div className='LegendItem'>
      <img className="LegendItem__swatch" src={imageSrc} />
      <span className='LegendItem__label'>{label}</span>
    </div>
  )
};

export default LegendItem;