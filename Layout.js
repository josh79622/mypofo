'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteConfig } from '../context/SiteConfigContext';

export const Layout = ({ children }) => {
  const { language, setLanguage, t } = useLanguage();
  const { config, currentUserId } = useSiteConfig();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  let navLinks;
  let brandLink;
  let brandName;

  if (currentUserId) {
    brandName = config.websiteTitle;
    brandLink = `/${currentUserId}`;
    navLinks = [
      { name: t('home'), path: `/${currentUserId}` },
      { name: t('projects'), path: `/${currentUserId}/projects` },
      { name: t('admin'), path: '/admin' },
    ];
  } else {
    brandName = "POFO";
    brandLink = "/";
    navLinks = [
      { name: "All Portfolios", path: "/" },
      { name: "Sign Up / Login", path: "/admin" },
    ];
  }

  const isActive = (path) => pathname === path;
  const isLandingPage = pathname === '/';
  const showLanguageToggle = !isLandingPage && config.showLanguageSwitcher;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={brandLink} className="text-2xl font-bold tracking-tight text-indigo-600 truncate max-w-[200px] sm:max-w-md">
              {brandName}
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-indigo-600'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {showLanguageToggle && (
                <div className="flex items-center space-x-2 pl-4 border-l border-neutral-200">
                  <span className={`text-xs font-bold transition-colors ${language === 'en' ? 'text-indigo-600' : 'text-neutral-400'}`}>EN</span>
                  <button
                    onClick={toggleLanguage}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      language === 'zh' ? 'bg-indigo-600' : 'bg-neutral-200'
                    }`}
                    role="switch"
                    aria-checked={language === 'zh'}
                    aria-label="Toggle Language"
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        language === 'zh' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold transition-colors ${language === 'zh' ? 'text-indigo-600' : 'text-neutral-400'}`}>中文</span>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-neutral-600 hover:text-neutral-900 p-2"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-neutral-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {showLanguageToggle && (
                <div className="border-t border-neutral-100 mt-2 pt-2 px-3 flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Language</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold ${language === 'en' ? 'text-indigo-600' : 'text-neutral-400'}`}>EN</span>
                    <button
                      onClick={() => {
                        toggleLanguage();
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        language === 'zh' ? 'bg-indigo-600' : 'bg-neutral-200'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          language === 'zh' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-bold ${language === 'zh' ? 'text-indigo-600' : 'text-neutral-400'}`}>中文</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} {config.websiteTitle}.
          </p>
          
          <div className="flex space-x-6 items-center">
             <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 font-medium">
               All Portfolios
             </Link>
             
             {!currentUserId && (
               <Link href="/admin" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                 Join & Create Your Portfolio
               </Link>
             )}
          </div>
        </div>
      </footer>
    </div>
  );
};