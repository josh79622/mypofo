'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Github, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ProjectCard = ({ project }) => {
  const { language, t } = useLanguage();
  
  const projectLink = `/${project.ownerId}/projects/${project.id}`;

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-neutral-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <Link href={projectLink} className="relative h-48 overflow-hidden bg-neutral-100 block cursor-pointer">
        <img
          src={project.imageUrl}
          alt={language === 'en' ? project.title_en : project.title_zh}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </Link>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex flex-wrap gap-2 mb-3">
          {project.tags.map((tag) => (
            <span 
              key={tag} 
              className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md uppercase tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-indigo-600 transition-colors">
          {language === 'en' ? project.title_en : project.title_zh}
        </h3>
        
        <p className="text-neutral-600 text-sm mb-6 flex-grow line-clamp-3">
          {language === 'en' ? project.desc_en : project.desc_zh}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-100">
          <div className="flex space-x-3">
            {project.githubUrl && (
              <a 
                href={project.githubUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                title="GitHub"
              >
                <Github size={18} />
              </a>
            )}
            {project.demoUrl && (
              <a 
                href={project.demoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                title="Demo"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
          
          <Link
            href={projectLink}
            className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {t('readMore')} <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};