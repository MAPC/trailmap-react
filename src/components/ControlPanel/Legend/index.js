import React, { useContext, useMemo } from "react";
import { LayerContext } from "../../../App";
import { getLandlineLegendItems } from "../trailLayerConfig";

const Legend = () => {
  const { showLandlineLayer, landlines } = useContext(LayerContext);

  const legendItems = useMemo(
    () => getLandlineLegendItems(landlines),
    [landlines]
  );

  if (!showLandlineLayer) {
    return null;
  }

  return (
    <div className="Legend pb-4">
      {legendItems.map((item) => (
        <div key={item.key} className="LegendItem d-flex align-items-start">
          <span
            className={`LegendItem__swatch${
              item.dashed ? " LegendItem__swatch--dashed" : ""
            }`}
            style={{ "--swatch-color": item.color }}
            aria-hidden="true"
          />
          <span className="LegendItem__label d-inline-flex">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Legend;
