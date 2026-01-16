import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BrandingContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    app_name: 'HR Portal',
    logo_url: '',
    favicon_url: ''
  });

  useEffect(() => {
    fetchBranding();
  }, []);

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
        favicon_url: getFullUrl(settings.favicon_url)
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
      
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    }
  };

  const updateFavicon = (url) => {
    // Update all favicon links
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

  const updateManifest = (brandingData) => {
    try {
      // Point manifest to dynamic API endpoint
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        // Use API endpoint for dynamic manifest with cache busting
        manifestLink.href = `${API}/manifest.json?t=${Date.now()}`;
      }

      // Update meta tags
      const appNameMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appNameMeta) appNameMeta.content = brandingData.app_name;

      const applicationNameMeta = document.querySelector('meta[name="application-name"]');
      if (applicationNameMeta) applicationNameMeta.content = brandingData.app_name;
      
      // Update description
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
