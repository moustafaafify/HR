import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BrandingContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Helper to lighten/darken a color
const adjustColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const adjust = (value) => {
    const adjusted = Math.round(value + (255 - value) * (percent / 100));
    return Math.min(255, Math.max(0, adjusted));
  };
  
  if (percent < 0) {
    // Darken
    const factor = 1 + percent / 100;
    return `#${Math.round(rgb.r * factor).toString(16).padStart(2, '0')}${Math.round(rgb.g * factor).toString(16).padStart(2, '0')}${Math.round(rgb.b * factor).toString(16).padStart(2, '0')}`;
  }
  
  return `#${adjust(rgb.r).toString(16).padStart(2, '0')}${adjust(rgb.g).toString(16).padStart(2, '0')}${adjust(rgb.b).toString(16).padStart(2, '0')}`;
};

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    app_name: 'HR Portal',
    logo_url: '',
    favicon_url: '',
    primary_color: '#2D4F38',
    accent_color: '#4A7C59',
    dark_mode: false
  });

  useEffect(() => {
    fetchBranding();
  }, []);

  // Apply theme CSS variables whenever branding changes
  useEffect(() => {
    applyThemeColors(branding);
  }, [branding.primary_color, branding.accent_color, branding.dark_mode]);

  const applyThemeColors = (brandingData) => {
    const root = document.documentElement;
    const { primary_color, accent_color, dark_mode } = brandingData;
    
    // Set primary color variants
    root.style.setProperty('--primary', primary_color);
    root.style.setProperty('--primary-light', adjustColor(primary_color, 30));
    root.style.setProperty('--primary-lighter', adjustColor(primary_color, 60));
    root.style.setProperty('--primary-dark', adjustColor(primary_color, -20));
    root.style.setProperty('--primary-foreground', '#ffffff');
    
    // Set accent color variants
    root.style.setProperty('--accent', accent_color);
    root.style.setProperty('--accent-light', adjustColor(accent_color, 30));
    root.style.setProperty('--accent-dark', adjustColor(accent_color, -20));
    
    // RGB values for opacity usage
    const primaryRgb = hexToRgb(primary_color);
    if (primaryRgb) {
      root.style.setProperty('--primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
    }
    
    const accentRgb = hexToRgb(accent_color);
    if (accentRgb) {
      root.style.setProperty('--accent-rgb', `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`);
    }
    
    // Apply dark mode
    if (dark_mode) {
      document.body.classList.add('dark-mode');
      root.style.setProperty('--background', '#0f172a');
      root.style.setProperty('--foreground', '#f8fafc');
      root.style.setProperty('--card', '#1e293b');
      root.style.setProperty('--card-foreground', '#f8fafc');
      root.style.setProperty('--muted', '#334155');
      root.style.setProperty('--muted-foreground', '#94a3b8');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--sidebar-bg', '#0f172a');
      root.style.setProperty('--sidebar-border', '#1e293b');
    } else {
      document.body.classList.remove('dark-mode');
      root.style.setProperty('--background', '#FCFCFA');
      root.style.setProperty('--foreground', '#0f172a');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--card-foreground', '#0f172a');
      root.style.setProperty('--muted', '#f1f5f9');
      root.style.setProperty('--muted-foreground', '#64748b');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--sidebar-bg', '#ffffff');
      root.style.setProperty('--sidebar-border', '#e2e8f0');
    }
  };

  const fetchBranding = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      const settings = response.data;
      
      // Helper to get full URL for relative paths
      const getFullUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${BACKEND_URL}${path}`;
      };
      
      const newBranding = {
        app_name: settings.app_name || 'HR Portal',
        logo_url: getFullUrl(settings.logo_url),
        favicon_url: getFullUrl(settings.favicon_url),
        primary_color: settings.primary_color || '#2D4F38',
        accent_color: settings.accent_color || '#4A7C59',
        dark_mode: settings.dark_mode || false
      };
      
      setBranding(newBranding);
      
      // Update document title
      document.title = newBranding.app_name;
      
      // Update favicon if set
      if (newBranding.favicon_url) {
        updateFavicon(newBranding.favicon_url);
      }
      
      // Update manifest and meta tags
      updateManifest(newBranding);
      
      // Update apple touch icons if logo is set
      if (newBranding.logo_url) {
        updateAppleTouchIcons(newBranding.logo_url);
      }
      
      // Update theme color meta tag
      updateThemeColor(newBranding.primary_color);
      
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    }
  };

  const updateFavicon = (url) => {
    const links = document.querySelectorAll("link[rel*='icon']");
    links.forEach(link => {
      if (!link.rel.includes('apple-touch-icon')) {
        link.href = url;
      }
    });
  };

  const updateAppleTouchIcons = (url) => {
    const appleLinks = document.querySelectorAll("link[rel='apple-touch-icon']");
    appleLinks.forEach(link => {
      link.href = url;
    });
  };

  const updateThemeColor = (color) => {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = color;
  };

  const updateManifest = (brandingData) => {
    try {
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.href = `${API}/manifest.json?t=${Date.now()}`;
      }

      const appNameMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appNameMeta) appNameMeta.content = brandingData.app_name;

      const applicationNameMeta = document.querySelector('meta[name="application-name"]');
      if (applicationNameMeta) applicationNameMeta.content = brandingData.app_name;
      
      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) descriptionMeta.content = `${brandingData.app_name} - Your complete HR management solution`;

    } catch (error) {
      console.error('Failed to update manifest:', error);
    }
  };

  return (
    <BrandingContext.Provider value={{ 
      branding,
      refreshBranding: fetchBranding
    }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
