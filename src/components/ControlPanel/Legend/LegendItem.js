import React, { useEffect } from 'react';

const LegendItem = ({ imageSrc, label }) => {

  return (
    <div className='LegendItem d-flex align-items-start'>
      <img className="LegendItem__swatch d-inline-flex pe-2" src={imageSrc} />
      <span className='LegendItem__label d-inline-flex'>{label}</span>
    </div>
  );
};

export default LegendItem;