'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Mail, Download, Github, Linkedin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { dataService } from '../../services/data';
import { ProjectCard } from '../../components/ProjectCard';

export default function UserHome() {
  const params = useParams();
  const userId = params.userId;
  const { t, language } = useLanguage();
  const { config } = useSiteConfig();
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;
      try {
        const all = await dataService.getProjects(userId);
        setFeaturedProjects(all.filter(p => p.featured).slice(0, 3));
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [userId]);

  const renderTextWithBreaks = (text) => {
    return (text || "").split('\n').map((line, index) => (
      <p key={index} className="mb-4 last:mb-0">
        {line}
      </p>
    ));
  };

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-indigo-50 to-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-neutral-900 tracking-tight mb-6 animate-fade-in-up">
            {language === 'en' ? config.heroTitle.en : config.heroTitle.zh}
          </h1>
          <p className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
             {language === 'en' ? config.heroSubtitle.en : config.heroSubtitle.zh}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={`/${userId}/projects`}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              {t('viewAll')} <ArrowRight size={20} className="ml-2" />
            </Link>
            <a
              href={`mailto:${config.email}`}
              className="inline-flex items-center justify-center px-6 py-3 border border-neutral-300 text-base font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 transition-all shadow-sm hover:shadow"
            >
              <Mail size={20} className="mr-2" /> {t('contact')}
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">{t('featured')}</h2>
            <div className="h-1 w-20 bg-indigo-600 mt-2 rounded-full"></div>
          </div>
          <Link 
            href={`/${userId}/projects`}
            className="hidden sm:flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
          >
            {t('viewAll')} <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-500">{t('loading')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-neutral-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="flex items-center gap-5 mb-6">
               {config.avatarUrl && (
                  <img src={config.avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-lg flex-shrink-0" />
               )}
               <h2 className="text-3xl font-bold">{t('about')}</h2>
            </div>
            <div className="text-neutral-400 text-lg leading-relaxed mb-8">
               {renderTextWithBreaks(language === 'en' ? config.aboutText.en : config.aboutText.zh)}
            </div>
            <div className="flex space-x-4 mt-6">
              {config.githubUrl && <a href={config.githubUrl} target="_blank" className="p-3 bg-neutral-800 rounded-full text-neutral-400 hover:text-white"><Github size={20} /></a>}
              {config.linkedinUrl && <a href={config.linkedinUrl} target="_blank" className="p-3 bg-neutral-800 rounded-full text-neutral-400 hover:text-white"><Linkedin size={20} /></a>}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700">
              <h3 className="text-xl font-semibold mb-6 text-white">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {config.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-neutral-700 text-neutral-200 rounded-md text-sm border border-neutral-600">{skill}</span>
                ))}
              </div>
            </div>

            {config.resumeUrl && (
              <a 
                href={config.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-bold rounded-xl text-neutral-900 bg-white hover:bg-neutral-200 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Download size={20} className="mr-2" />
                <span>{t('downloadResume')}</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}