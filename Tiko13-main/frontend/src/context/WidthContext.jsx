import React, { useState, createContext, useContext, useEffect } from 'react';

const WidthContext = createContext();

export function usePadding() {
  return useContext(WidthContext);
}

export function WidthProvider({ children }) {
  const savedPadding = JSON.parse(localStorage.getItem('padding'));
  const [padding, setPadding] = useState(savedPadding || { left: 1, right: 1 });

  const updatePadding = (newPadding) => {
    setPadding(newPadding);
  };

  useEffect(() => {
    localStorage.setItem('padding', JSON.stringify(padding));
  }, [padding]);

  return (
    <WidthContext.Provider value={{ padding, updatePadding }}>
      {children}
    </WidthContext.Provider>
  );
}