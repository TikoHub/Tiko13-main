import React, { createContext, useContext, useState } from 'react';

const StudioLineHeightContext = createContext();

export const useStudioLineHeight = () => {
  return useContext(StudioLineHeightContext);
};

export const StudioLineHeightProvider = ({ children }) => {
  const [studioLineHeight, setStudioLineHeight] = useState(1.5); // Изначальное значение высоты между словами

  const updateStudioLineHeight = (newLineHeight) => {
    setStudioLineHeight(newLineHeight);
  };

  return (
    <StudioLineHeightContext.Provider value={{ studioLineHeight, updateStudioLineHeight }}>
      {children}
    </StudioLineHeightContext.Provider>
  );
};