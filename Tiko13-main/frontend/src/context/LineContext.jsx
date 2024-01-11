import React, { createContext, useContext, useState } from 'react';

const LineHeightContext = createContext();

export const useLineHeight = () => {
  return useContext(LineHeightContext);
};

export const LineHeightProvider = ({ children }) => {
  const [lineHeight, setLineHeight] = useState(1.5); // Изначальное значение высоты между словами

  const updateLineHeight = (newLineHeight) => {
    setLineHeight(newLineHeight);
  };

  return (
    <LineHeightContext.Provider value={{ lineHeight, updateLineHeight }}>
      {children}
    </LineHeightContext.Provider>
  );
};