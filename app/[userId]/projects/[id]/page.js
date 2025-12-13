'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Github, ExternalLink, Calendar } from 'lucide-react';
import { dataService } from '../../../../services/data';
import { useLanguage } from '../../../../context/LanguageContext';

export default function ProjectDetail() {
  const params = useParams();
  const userId = params.userId;
  const id = params.id;
  
  const { t, language } = useLanguage();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadProject = async () => {
      try {
        const data = await dataService.getProjectById(id);
        setProject(data || null);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id]);

  const renderVideo = (url, key) => {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    if (ytMatch && ytMatch[1]) {
      return (
        <div key={key} className="relative w-full aspect-video my-6 rounded-xl overflow-hidden shadow-lg bg-black">
          <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} className="absolute top-0 left-0 w-full h-full" allowFullScreen />
        </div>
      );
    }
    const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return (
        <div key={key} className="relative w-full aspect-video my-6 rounded-xl overflow-hidden shadow-lg bg-black">
          <iframe src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`} className="absolute top-0 left-0 w-full h-full" allowFullScreen />
        </div>
      );
    }
    if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
      return (
        <video key={key} controls className="w-full rounded-xl shadow-lg my-6 bg-black">
          <source src={url} />
        </video>
      );
    }
    return (
      <div key={key} className="relative w-full aspect-video my-6 rounded-xl overflow-hidden shadow-lg bg-neutral-100">
        <iframe src={url} className="absolute top-0 left-0 w-full h-full" allowFullScreen />
      </div>
    );
  };

  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, lineIdx) => {
      if (!line.trim()) return <div key={lineIdx} className="h-4" />;
      const parts = line.split(/(\(https?:\/\/[^\)]+\)|\[https?:\/\/[^\]]+\])/g);
      return (
        <div key={lineIdx} className="mb-4 leading-relaxed text-neutral-700">
          {parts.map((part, partIdx) => {
            if (part.startsWith('(') && part.endsWith(')')) {
              return <img key={partIdx} src={part.slice(1, -1)} alt="Content" className="rounded-xl shadow-md my-6 max-w-full h-auto mx-auto block" />;
            } else if (part.startsWith('[') && part.endsWith(']')) {
              return renderVideo(part.slice(1, -1), partIdx);
            } else {
              return <span key={partIdx}>{part}</span>;
            }
          })}
        </div>
      );
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-neutral-500">{t('loading')}</div>;
  
  if (!project) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Project not found</h2>
      <Link href={`/${userId}/projects`} className="text-indigo-600 hover:underline">{t('backToProjects')}</Link>
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="bg-neutral-900 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${userId}/projects`} className="inline-flex items-center text-neutral-400 hover:text-white transition-colors mb-8">
            <ArrowLeft size={20} className="mr-2" />
            {t('backToProjects')}
          </Link>
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map(tag => <span key={tag} className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full">{tag}</span>)}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{language === 'en' ? project.title_en : project.title_zh}</h1>
          <p className="text-xl text-neutral-300 max-w-2xl leading-relaxed">{language === 'en' ? project.desc_en : project.desc_zh}</p>
        </div>
      </div>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-white rounded-xl shadow-xl border border-neutral-100 overflow-hidden">
           <img src={project.imageUrl} alt={project.title_en} className="w-full h-auto max-h-[500px] object-cover" />
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-neutral-100">
              <div className="flex items-center text-neutral-500 text-sm">
                <Calendar size={16} className="mr-2" />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-4">
                {project.githubUrl && <a href={project.githubUrl} target="_blank" className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"><Github size={18} className="mr-2" />{t('github')}</a>}
                {project.demoUrl && <a href={project.demoUrl} target="_blank" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><ExternalLink size={18} className="mr-2" />{t('demo')}</a>}
              </div>
            </div>
            <div className="prose prose-lg prose-indigo max-w-none text-neutral-700">
              {renderContent(language === 'en' ? project.content_en : project.content_zh)}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}