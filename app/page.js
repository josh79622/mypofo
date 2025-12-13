'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dataService } from '../services/data';
import { UserPlus, User as UserIcon } from 'lucide-react';

export default function Landing() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await dataService.getAllUsers();
        const usersWithAvatars = await Promise.all(allUsers.map(async (user) => {
           try {
              const config = await dataService.getSiteConfig(user.id);
              return { ...user, avatarUrl: config.avatarUrl };
           } catch (e) {
              return user;
           }
        }));
        setUsers(usersWithAvatars);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        <div className="text-center max-w-3xl mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Discover Amazing <span className="text-indigo-600">Portfolios</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Explore works from talented developers and designers. 
            Join our community to build your own professional portfolio in minutes.
          </p>
        </div>

        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        ) : (
          <div className="w-full">
            {users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {users.map((user) => (
                  <Link 
                    key={user.id} 
                    href={`/${user.id}`}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group"
                  >
                    <div className="h-24 w-24 mb-4 relative">
                        {user.avatarUrl ? (
                            <img 
                                src={user.avatarUrl} 
                                alt={user.username} 
                                className="w-full h-full rounded-full object-cover border-2 border-indigo-100 group-hover:border-indigo-600 transition-colors"
                            />
                        ) : (
                            <div className="w-full h-full bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <UserIcon size={32} />
                            </div>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{user.username}</h3>
                    <p className="text-sm text-gray-500">@{user.id}</p>
                    <span className="mt-4 text-sm font-medium text-indigo-600 group-hover:underline">View Portfolio &rarr;</span>
                  </Link>
                ))}
              </div>
            ) : (
               <div className="text-center py-12 text-gray-500 mb-10">
                 No portfolios yet. Be the first one!
               </div>
            )}
            
            <div className="flex justify-center">
                <Link 
                  href="/admin?mode=signup" 
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-full shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UserPlus size={24} className="mr-3" />
                  Sign Up & Create Your Portfolio
                </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}