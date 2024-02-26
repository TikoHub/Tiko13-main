// ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    const handleHistoryChange = () => {
      if (location.pathname !== '/' && location.pathname.includes('/reader/')) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    };

    // Подписываемся на событие изменения истории браузера
    window.addEventListener("popstate", handleHistoryChange);

    // Удаляем подписку при размонтировании компонента
    return () => {
      window.removeEventListener("popstate", handleHistoryChange);
    };
  }, [location]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const readerMainElement = document.querySelector(".reader-main");
    if (readerMainElement) {
      readerMainElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};