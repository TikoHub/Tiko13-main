import React, { createContext, useState, useContext } from 'react';

const FontStudioContext = createContext();

export const useStudioFont = () => {
  return useContext(FontStudioContext);
};

export const FontStudioProvider = ({ children }) => {
  const [fontStudioFamily, setFontStudioFamily] = useState('Times New Roman'); 

  const setStudioFont = (font) => {
    setFontStudioFamily(font);
  };

  const fontStudioList = [
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
    <FontStudioContext.Provider value={{ fontStudioFamily, setStudioFont, fontStudioList }}>
      {children}
    </FontStudioContext.Provider>
  );
};