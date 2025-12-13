'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { dataService } from '../../../services/data';
import { ProjectCard } from '../../../components/ProjectCard';
import { useLanguage } from '../../../context/LanguageContext';

export default function ProjectList() {
  const params = useParams();
  const userId = params.userId;
  const { t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      try {
        const data = await dataService.getProjects(userId);
        setProjects(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  return (
    <div className="bg-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">{t('projects')}</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            A collection of my work, experiments, and open source contributions.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-indigo-600 text-lg font-medium animate-pulse">{t('loading')}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}