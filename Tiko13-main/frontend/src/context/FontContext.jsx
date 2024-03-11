import React, { createContext, useState, useContext, useEffect } from 'react';

const FontContext = createContext();

export const useFont = () => {
  return useContext(FontContext);
};

export const FontProvider = ({ children }) => {
  // Load font family from localStorage or use default
  const savedFontFamily = localStorage.getItem('fontFamily');
  const [fontFamily, setFontFamily] = useState(savedFontFamily || 'Times New Roman');

  const setFont = (font) => {
    setFontFamily(font);
  };

  const fontList = [
    'Times New Roman',
    'Roboto',
    'Verdana',
    'Georgia',
    'Arial',
    'Alegreya',
    'Comfortaa',
    'Fira Sans',
    'PT Sans',
  ];


  useEffect(() => {
    localStorage.setItem('fontFamily', fontFamily);
  }, [fontFamily]);

  return (
    <FontContext.Provider value={{ fontFamily, setFont, fontList }}>
      {children}
    </FontContext.Provider>
  );
};