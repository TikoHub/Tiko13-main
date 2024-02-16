import React, {useState, useEffect} from 'react';


const StudioFontSizeContext = React.createContext();

export const useStudioFontSize = () => {
  return React.useContext(StudioFontSizeContext);
};

export const StudioFontSizeProvider = ({ children }) => {
  const [studioFontSize, setStudioFontSize] = useState(() => {
    const savedSize = localStorage.getItem('studioFontSize');
    return savedSize ? parseInt(savedSize, 10) : 16; 
  });

  useEffect(() => {
    localStorage.setItem('studioFontSize', studioFontSize.toString()); 
  }, [studioFontSize]);

  return (
    <StudioFontSizeContext.Provider value={{ studioFontSize, setStudioFontSize }}>
      {children}
    </StudioFontSizeContext.Provider>
  );
};

