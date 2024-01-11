import React, { createContext, useState, useContext } from 'react';

const FontContext = createContext();

export const useFont = () => {
  return useContext(FontContext);
};

export const FontProvider = ({ children }) => {
  const [fontFamily, setFontFamily] = useState('Times New Roman'); // начальное значение fontFamily

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

  return (
    <FontContext.Provider value={{ fontFamily, setFont, fontList }}>
      {children}
    </FontContext.Provider>
  );
};