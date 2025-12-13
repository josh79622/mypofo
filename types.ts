
export type Language = 'en' | 'zh';

export interface User {
  id: string; // The slug (e.g., 'josh')
  username: string; // Display name
  password: string; // Simple password (insecure for prod, ok for demo)
  createdAt: number;
}

export interface Project {
  id: string;
  ownerId: string; // Link project to specific user
  title_en: string;
  title_zh: string;
  desc_en: string;
  desc_zh: string;
  content_en: string;
  content_zh: string;
  tags: string[];
  imageUrl: string;
  githubUrl?: string;
  demoUrl?: string;
  featured: boolean;
  order?: number;
  createdAt: number;
}

export interface SiteConfig {
  websiteTitle: string;
  avatarUrl?: string; // New field for profile picture
  showLanguageSwitcher: boolean; // New setting
  heroTitle: { en: string; zh: string };
  heroSubtitle: { en: string; zh: string };
  aboutText: { en: string; zh: string };
  skills: string[];
  resumeUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  email: string;
}

export interface Translation {
  [key: string]: {
    en: string;
    zh: string;
  };
}
