import React, { createContext, useState, useContext } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const svgColor = isDarkMode ? "#000" : "#fff";
  const svgLogoColor = isDarkMode ? "#000" : "#E26DFF";


  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, svgColor, svgLogoColor }}>
      {children}
    </ThemeContext.Provider>
  );
};