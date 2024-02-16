import React, {useState, createContext, useContext } from 'react';


const StudioWidthContext = createContext();

export function useStudioPadding() {
  return useContext(StudioWidthContext);
}

export function StudioWidthProvider({ children }) {
  const [studioPadding, setStudioPadding] = useState({ left: 16, right: 16 });

  const updateStudioPadding = (newStudioPadding) => {
    setStudioPadding(newStudioPadding);
  };

  return (
    <StudioWidthContext.Provider value={{ studioPadding, updateStudioPadding }}>
      {children}
    </StudioWidthContext.Provider>
  );
}