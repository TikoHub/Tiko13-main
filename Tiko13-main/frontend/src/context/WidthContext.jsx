import React, {useState, createContext, useContext } from 'react';


const WidthContext = createContext();

export function usePadding() {
  return useContext(WidthContext);
}

export function WidthProvider({ children }) {
  const [padding, setPadding] = useState({ left: 16, right: 16 });

  const updatePadding = (newPadding) => {
    setPadding(newPadding);
  };

  return (
    <WidthContext.Provider value={{ padding, updatePadding }}>
      {children}
    </WidthContext.Provider>
  );
}