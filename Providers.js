'use client';

import React from 'react';
import { LanguageProvider } from '../context/LanguageContext';
import { SiteConfigProvider } from '../context/SiteConfigContext';

export function Providers({ children }) {
  return (
    <LanguageProvider>
      <SiteConfigProvider>
        {children}
      </SiteConfigProvider>
    </LanguageProvider>
  );
}