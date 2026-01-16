import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MobileConfigContext = createContext();

export const useMobileConfig = () => {
  const context = useContext(MobileConfigContext);
  if (!context) {
    throw new Error('useMobileConfig must be used within a MobileConfigProvider');
  }
  return context;
};

export const MobileConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    appName: 'HR Portal',
    primaryColor: '#2D4F38',
    secondaryColor: '#4F7942',
    accentColor: '#FFB800',
    splashColor: '#2D4F38'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/settings/mobile`);
      if (response.data) {
        setConfig(prev => ({
          ...prev,
          appName: response.data.appName || prev.appName,
          primaryColor: response.data.primaryColor || prev.primaryColor,
          secondaryColor: response.data.secondaryColor || prev.secondaryColor,
          accentColor: response.data.accentColor || prev.accentColor,
          splashColor: response.data.splashColor || prev.splashColor
        }));
        
        // Apply colors to CSS variables
        applyColors(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch mobile config:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyColors = (data) => {
    const root = document.documentElement;
    if (data.primaryColor) {
      root.style.setProperty('--mobile-primary', data.primaryColor);
    }
    if (data.secondaryColor) {
      root.style.setProperty('--mobile-secondary', data.secondaryColor);
    }
    if (data.accentColor) {
      root.style.setProperty('--mobile-accent', data.accentColor);
    }
    if (data.splashColor) {
      root.style.setProperty('--mobile-splash', data.splashColor);
    }
    
    // Also update the theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta && data.primaryColor) {
      themeColorMeta.setAttribute('content', data.primaryColor);
    }
  };

  const refreshConfig = () => {
    fetchConfig();
  };

  return (
    <MobileConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </MobileConfigContext.Provider>
  );
};

export default MobileConfigContext;
