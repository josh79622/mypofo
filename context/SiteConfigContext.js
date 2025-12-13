'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_SITE_CONFIG } from '../app/constants';
import { dataService } from '../services/data';

const SiteConfigContext = createContext(undefined);

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_SITE_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const pathname = usePathname();

  const refreshConfig = async (specificUserId) => {
    const targetId = specificUserId || currentUserId;
    if (!targetId) {
      setConfig(DEFAULT_SITE_CONFIG);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const fetchedConfig = await dataService.getSiteConfig(targetId);
      setConfig(fetchedConfig);
    } catch (err) {
      console.error("Failed to load site config, using defaults", err);
      setConfig(DEFAULT_SITE_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Logic: Split the path to find the user ID.
    // e.g., /josh/projects -> ['josh', 'projects']
    const parts = pathname?.split('/').filter(p => p) || [];
    const reserved = ['admin', 'signup', 'login'];
    const potentialUser = parts[0];

    // If we are on admin routes, don't auto-set user based on URL
    if (pathname?.startsWith('/admin')) return;

    if (potentialUser && !reserved.includes(potentialUser)) {
      if (potentialUser !== currentUserId) {
        setCurrentUserId(potentialUser);
      }
    } else {
      if (currentUserId !== null) {
        setCurrentUserId(null); 
        setConfig(DEFAULT_SITE_CONFIG);
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (currentUserId) {
      refreshConfig(currentUserId);
    }
  }, [currentUserId]);

  return (
    <SiteConfigContext.Provider value={{ config, refreshConfig, isLoading, currentUserId, setCurrentUserId }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};