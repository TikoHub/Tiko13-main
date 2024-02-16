import React, { createContext, useState, useContext } from "react";

const StudioThemeContext = createContext();

export const useStudioTheme = () => {
  return useContext(StudioThemeContext);
};

export const StudioThemeProvider = ({ children }) => {
  const [isStudioDarkMode, setStudioDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setStudioDarkMode((prevStudioMode) => !prevStudioMode);
  };

  const svgStudioColor = isStudioDarkMode ? "#000" : "#fff";
  const svgStudioLogoColor = isStudioDarkMode ? "#000" : "#E26DFF";


  return (
    <StudioThemeContext.Provider value={{ isStudioDarkMode, toggleDarkMode, svgStudioColor, svgStudioLogoColor }}>
      {children}
    </StudioThemeContext.Provider>
  );
};