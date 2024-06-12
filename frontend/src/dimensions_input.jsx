import React, { useState, useRef } from "react";

function DimensionsInput(props) {
  const {
    height,
    width,
    length,
    dimensionsUnit,
    setDimensionsUnit,
    setHeight,
    setWidth,
    setLength,
  } = props;

  function handleHeightChange(e) {
    if (e.target.value < 0) {
      return;
    }
    setHeight(() => e.target.value);
  }

  function handleDimensionUnitChange(e) {
    setDimensionsUnit(() => e.target.value);
  }

  function handleWidthChange(e) {
    if (e.target.value < 0) {
      return;
    }
    setWidth(() => e.target.value);
  }

  function handleLengthChange(e) {
    if (e.target.value < 0) {
      return;
    }
    setLength(() => e.target.value);
  }

  return (
    <div className="flex items-center border border-gray-300 rounded-md shadow-sm h-12">
      <input
        type="number"
        placeholder="H"
        className="h-8 flex-1 w-16 px-3 border-r border-gray-300 focus:outline-none"
        value={height}
        onChange={handleHeightChange}
      />
      <input
        type="number"
        placeholder="W"
        className="h-8 flex-1 w-16 px-3 border-r border-gray-300 focus:outline-none"
        value={width}
        onChange={handleWidthChange}
      />
      <input
        type="number"
        placeholder="L"
        className="h-8 flex-1 w-16 px-3 focus:outline-none"
        value={length}
        onChange={handleLengthChange}
      />
      <select
        className="h-8 ml-2 px-3 border border-gray-300 rounded-md focus:outline-none"
        value={dimensionsUnit}
        onChange={handleDimensionUnitChange}
      >
        <option value="cm">cm</option>
        <option value="in">in</option>
        <option value="mm">mm</option>
      </select>
    </div>
  );
}

export default DimensionsInput;
