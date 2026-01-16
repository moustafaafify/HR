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
      
      const newBranding = {
        app_name: settings.app_name || 'HR Portal',
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || ''
      };
      
      setBranding(newBranding);
      
      // Update document title
      document.title = newBranding.app_name;
      
      // Update favicon if set
      if (newBranding.favicon_url) {
        updateFavicon(newBranding.favicon_url);
      }
      
      // Update manifest dynamically
      updateManifest(newBranding);
      
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    }
  };

  const updateFavicon = (url) => {
    // Update all favicon links
    const links = document.querySelectorAll("link[rel*='icon']");
    links.forEach(link => {
      link.href = url;
    });
    
    // Also update apple-touch-icon
    const appleLinks = document.querySelectorAll("link[rel='apple-touch-icon']");
    appleLinks.forEach(link => {
      link.href = url;
    });
  };

  const updateManifest = async (brandingData) => {
    try {
      // Create a dynamic manifest
      const manifest = {
        name: brandingData.app_name,
        short_name: brandingData.app_name,
        description: `${brandingData.app_name} - Your complete HR management solution`,
        start_url: "/?source=pwa",
        id: "hr-portal-pwa",
        display: "standalone",
        background_color: "#2D4F38",
        theme_color: "#2D4F38",
        orientation: "portrait-primary",
        scope: "/",
        lang: "en",
        dir: "ltr",
        icons: brandingData.logo_url ? [
          {
            src: brandingData.logo_url,
            sizes: "72x72",
            type: "image/png",
            purpose: "any"
          },
          {
            src: brandingData.logo_url,
            sizes: "96x96",
            type: "image/png",
            purpose: "any"
          },
          {
            src: brandingData.logo_url,
            sizes: "128x128",
            type: "image/png",
            purpose: "any"
          },
          {
            src: brandingData.logo_url,
            sizes: "144x144",
            type: "image/png",
            purpose: "any"
          },
          {
            src: brandingData.logo_url,
            sizes: "152x152",
            type: "image/png",
            purpose: "any"
          },
          {
            src: brandingData.logo_url,
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: brandingData.logo_url,
            sizes: "384x384",
            type: "image/png",
            purpose: "any"
          },
          {
            src: brandingData.logo_url,
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: brandingData.logo_url,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ] : [
          {
            src: "/icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ],
        categories: ["business", "productivity"],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Dashboard",
            description: "Go to Dashboard",
            url: "/dashboard?source=pwa",
            icons: [{ src: brandingData.logo_url || "/icons/icon-96x96.png", sizes: "96x96" }]
          }
        ]
      };

      // Create a blob URL for the manifest
      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      // Update manifest link
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.href = manifestUrl;
      }

      // Update meta tags
      const appNameMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appNameMeta) appNameMeta.content = brandingData.app_name;

      const applicationNameMeta = document.querySelector('meta[name="application-name"]');
      if (applicationNameMeta) applicationNameMeta.content = brandingData.app_name;

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
