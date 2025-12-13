'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Edit2, Trash2, X, Database, AlertCircle, Lock, User, Key, ShieldCheck, Settings as SettingsIcon, Layout as LayoutIcon, GripVertical, UserPlus, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { dataService } from '../../services/data';

// --- Cookie Helpers ---
const COOKIE_NAME = 'admin_session';

const setCookie = (name, value, days) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i=0;i < ca.length;i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
};

const deleteCookie = (name) => {   
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

function AdminContent() {
  const { t } = useLanguage();
  const { config, refreshConfig, setCurrentUserId } = useSiteConfig();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Auth State
  const [authStep, setAuthStep] = useState('loading');
  const [authForm, setAuthForm] = useState({ userId: '', username: '', password: '' });
  const [authError, setAuthError] = useState(null);
  const [activeUserId, setActiveUserId] = useState(null);

  // Dashboard State
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Drag and Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  
  // Settings Form State
  const [settingsForm, setSettingsForm] = useState(config);
  
  // Project Form State
  const initialForm = {
    title_en: '', title_zh: '',
    desc_en: '', desc_zh: '',
    content_en: '', content_zh: '',
    tags: '',
    imageUrl: '',
    githubUrl: '',
    demoUrl: '',
    featured: false
  };
  const [formData, setFormData] = useState(initialForm);

  // --- Auth Flow ---

  useEffect(() => {
    // Check for query param ?mode=signup
    if (searchParams.get('mode') === 'signup') {
        setAuthStep('signup');
    }
    
    const checkAuthStatus = async () => {
      try {
        const sessionCookie = getCookie(COOKIE_NAME);
        if (sessionCookie) {
          try {
            const decoded = atob(sessionCookie);
            const { userId, password } = JSON.parse(decoded);
            
            const user = await dataService.verifyUser(userId, password);
            if (user) {
              setActiveUserId(userId);
              // Update context so Layout knows which user header to show
              setCurrentUserId(userId); 
              
              setAuthForm({ userId: user.id, username: user.username, password: '' }); 
              setAuthStep('dashboard');
              
              // Load data
              setSettingsForm(await dataService.getSiteConfig(userId));
              fetchProjects(userId);
              return;
            } else {
              deleteCookie(COOKIE_NAME);
            }
          } catch (e) {
            console.error("Cookie parse error", e);
            deleteCookie(COOKIE_NAME);
          }
        }
        
        // If not authenticated, stay at signup or login based on prior logic
        if (authStep === 'loading') {
            setAuthStep(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
        }

      } catch (error) {
        console.error("Auth check failed:", error);
        setErrorMsg(error.message);
        setAuthStep('login');
      }
    };
    checkAuthStatus();
  }, [searchParams]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    // Basic Validation
    const userIdSlug = authForm.userId.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (userIdSlug.length < 3 || userIdSlug !== authForm.userId) {
        setAuthError("User ID must be lowercase alphanumeric (min 3 chars).");
        setIsLoading(false);
        return;
    }

    try {
      const exists = await dataService.checkUserExists(userIdSlug);
      if (exists) {
        setAuthError("User ID already exists. Please choose another.");
        setIsLoading(false);
        return;
      }

      await dataService.registerUser({
          id: userIdSlug,
          username: authForm.username,
          password: authForm.password,
          createdAt: Date.now()
      });

      alert("Account created successfully! Please login.");
      setAuthStep('login');
      setAuthForm({ userId: userIdSlug, username: '', password: '' }); 
    } catch (error) {
      setAuthError("Failed to register: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await dataService.verifyUser(authForm.userId, authForm.password);
      if (user) {
        const sessionData = JSON.stringify({
          userId: user.id,
          username: user.username,
          password: authForm.password
        });
        setCookie(COOKIE_NAME, btoa(sessionData), 1);
        
        setActiveUserId(user.id);
        setCurrentUserId(user.id); // Update context
        
        setAuthStep('dashboard');
        
        // Load User Data
        setSettingsForm(await dataService.getSiteConfig(user.id));
        fetchProjects(user.id); 
      } else {
        setAuthError("Invalid ID or password.");
      }
    } catch (error) {
      setAuthError("Login failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    deleteCookie(COOKIE_NAME);
    setAuthStep('login');
    setActiveUserId(null);
    setCurrentUserId(null); // Reset context
    setAuthForm({ userId: '', username: '', password: '' });
    refreshConfig(undefined); // Reset to defaults
  };

  // --- Dashboard Logic ---

  const fetchProjects = async (uid) => {
    try {
      setErrorMsg(null);
      const data = await dataService.getProjects(uid);
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setErrorMsg(`Connection Error: ${error.message || 'Unknown error'}`);
    }
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    const newProjects = [...projects];
    const [draggedItem] = newProjects.splice(draggedItemIndex, 1);
    newProjects.splice(targetIndex, 0, draggedItem);
    
    setProjects(newProjects);
    setDraggedItemIndex(null);

    try {
      await dataService.saveProjectOrder(newProjects);
    } catch (error) {
      console.error("Failed to save order", error);
      alert("Failed to save new order.");
      if (activeUserId) fetchProjects(activeUserId);
    }
  };

  // --- Project Management ---

  const handleOpenModal = (project) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        title_en: project.title_en,
        title_zh: project.title_zh,
        desc_en: project.desc_en,
        desc_zh: project.desc_zh,
        content_en: project.content_en,
        content_zh: project.content_zh,
        tags: project.tags.join(', '),
        imageUrl: project.imageUrl,
        githubUrl: project.githubUrl || '',
        demoUrl: project.demoUrl || '',
        featured: project.featured
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!activeUserId) return;

    setIsLoading(true);
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(t => t),
      ownerId: activeUserId // Attach logged-in user ID
    };
    try {
      if (editingId) {
        await dataService.updateProject(editingId, payload);
      } else {
        await dataService.addProject(payload);
      }
      await fetchProjects(activeUserId);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(`Failed to save project: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await dataService.deleteProject(id);
      if (activeUserId) await fetchProjects(activeUserId);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  // --- Settings Management ---

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    if (!activeUserId) return;
    setIsLoading(true);
    try {
        await dataService.saveSiteConfig(activeUserId, settingsForm);
        await refreshConfig(activeUserId); 
        alert("Portfolio settings saved successfully!");
    } catch (err) {
        console.error(err);
        alert(`Failed to save settings: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  // --- Render Functions ---

  if (authStep === 'loading') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-neutral-500">Checking session...</p>
      </div>
    );
  }

  if (authStep === 'login' || authStep === 'signup') {
    const isSignup = authStep === 'signup';
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-neutral-200">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              {isSignup ? <UserPlus size={24} /> : <Lock size={24} />}
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {isSignup ? 'Create Portfolio' : 'Login'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSignup 
                ? 'Join to create your own professional portfolio page.' 
                : 'Enter credentials to manage your portfolio.'}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={isSignup ? handleSignup : handleLogin}>
            {authError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
                {authError}
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              {isSignup && (
                 <div className="relative mb-2">
                    <User className="absolute top-3 left-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      className="appearance-none rounded-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Display Name (e.g. Josh Chen)"
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    />
                  </div>
              )}
              
              <div className="relative">
                <ShieldCheck className="absolute top-3 left-3 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  className="appearance-none rounded-t-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={isSignup ? "Unique User ID (slug, e.g. josh)" : "User ID"}
                  value={authForm.userId}
                  onChange={(e) => setAuthForm({ ...authForm, userId: e.target.value })}
                />
              </div>
              <div className="relative">
                <Key className="absolute top-3 left-3 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  className="appearance-none rounded-b-md relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (isSignup ? 'Register' : 'Sign in')}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
             <button 
                onClick={() => {
                    setAuthStep(isSignup ? 'login' : 'signup');
                    setAuthError(null);
                }}
                className="text-sm text-indigo-600 hover:underline"
             >
                 {isSignup ? "Already have an account? Login" : "No account? Create one"}
             </button>
          </div>
          <div className="text-center">
             <Link href="/" className="text-xs text-gray-500 hover:underline">Return to Landing Page</Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Dashboard Render ---

  return (
    <div className="bg-neutral-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {errorMsg && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Firestore Issue</h3>
                <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Link href={`/${activeUserId}`} className="text-indigo-600 hover:text-indigo-800">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-bold text-neutral-900">{t('adminTitle')}</h1>
            </div>
            
            <div className="flex items-center mt-2 space-x-4">
              <p className="text-sm text-neutral-500">Logged in as: <strong>{activeUserId}</strong></p>
              <div className="flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                <Database size={12} className="mr-1" />
                Firestore Active
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
             <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`${
                activeTab === 'projects'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <LayoutIcon size={18} className="mr-2" />
              Projects
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <SettingsIcon size={18} className="mr-2" />
              Global Settings
            </button>
          </nav>
        </div>

        {/* --- PROJECTS TAB --- */}
        {activeTab === 'projects' && (
          <div>
             <div className="flex justify-end mb-4">
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                >
                  <Plus size={20} className="mr-2" />
                  {t('addNew')}
                </button>
             </div>
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider w-10">
                      {/* Sort Handle Header */}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {projects.map((project, index) => (
                    <tr 
                      key={project.id} 
                      className={`hover:bg-neutral-50 transition-colors ${draggedItemIndex === index ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <td className="px-3 py-4 whitespace-nowrap cursor-move text-neutral-400 hover:text-neutral-600">
                        <GripVertical size={20} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-neutral-100 rounded-md overflow-hidden">
                            <img className="h-10 w-10 object-cover" src={project.imageUrl} alt="" />
                          </div>
                          <div className="ml-4">
                            <Link 
                                href={`/${activeUserId}/projects/${project.id}`} 
                                target="_blank"
                                className="text-sm font-medium text-indigo-600 hover:underline truncate max-w-[150px] block"
                            >
                              {project.title_en}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.featured ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Featured
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-800">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenModal(project)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-neutral-500">
                        {errorMsg ? 'Error loading projects.' : 'No projects found. Add one!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
           <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 md:p-8">
              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">General Information</h3>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Website Title</label>
                      <input
                        type="text"
                        value={settingsForm.websiteTitle}
                        onChange={e => setSettingsForm({...settingsForm, websiteTitle: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                       <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
                       <div className="flex gap-4 items-center">
                           <input
                            type="url"
                            value={settingsForm.avatarUrl || ''}
                            onChange={e => setSettingsForm({...settingsForm, avatarUrl: e.target.value})}
                            placeholder="https://example.com/avatar.jpg"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           />
                           {settingsForm.avatarUrl && (
                               <img 
                                 src={settingsForm.avatarUrl} 
                                 alt="Preview" 
                                 className="h-10 w-10 rounded-full object-cover border border-gray-200"
                               />
                           )}
                       </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex items-center">
                       <input
                         id="showLanguageSwitcher"
                         type="checkbox"
                         checked={settingsForm.showLanguageSwitcher ?? true}
                         onChange={e => setSettingsForm({...settingsForm, showLanguageSwitcher: e.target.checked})}
                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                       />
                       <label htmlFor="showLanguageSwitcher" className="ml-2 block text-sm text-gray-900">
                         Show Language Switcher on public site
                       </label>
                    </div>

                    {/* Hero Section */}
                    <div className="col-span-1 md:col-span-2 mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Hero Section</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hero Title (EN)</label>
                      <input
                        type="text"
                        value={settingsForm.heroTitle.en}
                        onChange={e => setSettingsForm({...settingsForm, heroTitle: {...settingsForm.heroTitle, en: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hero Title (ZH)</label>
                      <input
                        type="text"
                        value={settingsForm.heroTitle.zh}
                        onChange={e => setSettingsForm({...settingsForm, heroTitle: {...settingsForm.heroTitle, zh: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hero Subtitle (EN)</label>
                      <textarea
                        rows={3}
                        value={settingsForm.heroSubtitle.en}
                        onChange={e => setSettingsForm({...settingsForm, heroSubtitle: {...settingsForm.heroSubtitle, en: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hero Subtitle (ZH)</label>
                      <textarea
                        rows={3}
                        value={settingsForm.heroSubtitle.zh}
                        onChange={e => setSettingsForm({...settingsForm, heroSubtitle: {...settingsForm.heroSubtitle, zh: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    {/* About Section */}
                    <div className="col-span-1 md:col-span-2 mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">About Me</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">About Text (EN)</label>
                      <textarea
                        rows={4}
                        value={settingsForm.aboutText.en}
                        onChange={e => setSettingsForm({...settingsForm, aboutText: {...settingsForm.aboutText, en: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">About Text (ZH)</label>
                      <textarea
                        rows={4}
                        value={settingsForm.aboutText.zh}
                        onChange={e => setSettingsForm({...settingsForm, aboutText: {...settingsForm.aboutText, zh: e.target.value}})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
                      <input
                        type="text"
                        value={settingsForm.skills.join(', ')}
                        onChange={e => setSettingsForm({...settingsForm, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                        placeholder="React, TypeScript, Node.js"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    {/* Links */}
                    <div className="col-span-1 md:col-span-2 mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Links & Contacts</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Resume Link (PDF)</label>
                      <input
                        type="text"
                        value={settingsForm.resumeUrl}
                        onChange={e => setSettingsForm({...settingsForm, resumeUrl: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                      <input
                        type="email"
                        value={settingsForm.email}
                        onChange={e => setSettingsForm({...settingsForm, email: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Github Profile URL</label>
                      <input
                        type="url"
                        value={settingsForm.githubUrl}
                        onChange={e => setSettingsForm({...settingsForm, githubUrl: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        value={settingsForm.linkedinUrl}
                        onChange={e => setSettingsForm({...settingsForm, linkedinUrl: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                 </div>

                 <div className="pt-5 flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                 </div>
              </form>
           </div>
        )}
      </div>

      {/* Project Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900 opacity-75" onClick={() => setIsModalOpen(false)}></div>
            </div>

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleProjectSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4 border-b border-neutral-100 pb-2">
                    <h3 className="text-lg leading-6 font-medium text-neutral-900">
                      {editingId ? 'Edit Project' : 'New Project'}
                    </h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-500">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     {/* English Fields */}
                     <div className="col-span-2 sm:col-span-1 space-y-4">
                        <label className="block text-sm font-medium text-gray-700">English Title</label>
                        <input
                          required
                          type="text"
                          value={formData.title_en}
                          onChange={e => setFormData({...formData, title_en: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        
                        <label className="block text-sm font-medium text-gray-700">English Description</label>
                        <textarea
                          required
                          rows={2}
                          value={formData.desc_en}
                          onChange={e => setFormData({...formData, desc_en: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />

                        <label className="block text-sm font-medium text-gray-700">English Content</label>
                        <textarea
                          required
                          rows={4}
                          value={formData.content_en}
                          onChange={e => setFormData({...formData, content_en: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                     </div>

                     {/* Chinese Fields */}
                     <div className="col-span-2 sm:col-span-1 space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Chinese Title</label>
                        <input
                          required
                          type="text"
                          value={formData.title_zh}
                          onChange={e => setFormData({...formData, title_zh: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        
                        <label className="block text-sm font-medium text-gray-700">Chinese Description</label>
                        <textarea
                          required
                          rows={2}
                          value={formData.desc_zh}
                          onChange={e => setFormData({...formData, desc_zh: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />

                        <label className="block text-sm font-medium text-gray-700">Chinese Content</label>
                        <textarea
                          required
                          rows={4}
                          value={formData.content_zh}
                          onChange={e => setFormData({...formData, content_zh: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                     </div>

                     {/* Image Selection Section */}
                     <div className="col-span-2 border-t border-neutral-100 pt-4 mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Project Image URL</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                                <input
                                  type="url"
                                  value={formData.imageUrl}
                                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                                  placeholder="https://example.com/image.jpg"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  Provide a direct link to an image hosted online.
                                </p>
                          </div>
                          
                          {/* Preview */}
                          <div className="flex justify-center items-center bg-neutral-50 rounded-lg border border-neutral-200 h-32 overflow-hidden">
                             {formData.imageUrl ? (
                               <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-contain" />
                             ) : (
                               <span className="text-gray-400 text-sm">No image preview</span>
                             )}
                          </div>
                        </div>
                     </div>

                     {/* Common Fields */}
                     <div className="col-span-2 border-t border-neutral-100 pt-4 mt-2 grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-gray-700">Github URL</label>
                          <input
                            type="url"
                            value={formData.githubUrl}
                            onChange={e => setFormData({...formData, githubUrl: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-gray-700">Demo URL</label>
                          <input
                            type="url"
                            value={formData.demoUrl}
                            onChange={e => setFormData({...formData, demoUrl: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                       </div>
                       <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                          <input
                            type="text"
                            value={formData.tags}
                            onChange={e => setFormData({...formData, tags: e.target.value})}
                            placeholder="React, TypeScript, Firebase"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                       </div>
                       <div className="col-span-2 flex items-center">
                          <input
                            id="featured"
                            type="checkbox"
                            checked={formData.featured}
                            onChange={e => setFormData({...formData, featured: e.target.checked})}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                            Mark as Featured Project
                          </label>
                       </div>
                     </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isLoading ? t('loading') : t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-neutral-500">Loading...</p>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}