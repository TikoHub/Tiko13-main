import React, { createContext, useContext, useState, useEffect } from 'react';

const LineHeightContext = createContext();

export const useLineHeight = () => {
  return useContext(LineHeightContext);
};

export const LineHeightProvider = ({ children }) => {

  const savedLineHeight = localStorage.getItem('lineHeight');
  const [lineHeight, setLineHeight] = useState(savedLineHeight ? parseFloat(savedLineHeight) : 1.5);

  const updateLineHeight = (newLineHeight) => {
    setLineHeight(newLineHeight);
  };


  useEffect(() => {
    localStorage.setItem('lineHeight', lineHeight.toString());
  }, [lineHeight]);

  return (
    <LineHeightContext.Provider value={{ lineHeight, updateLineHeight }}>
      {children}
    </LineHeightContext.Provider>
  );
};