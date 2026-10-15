import React from 'react';
import { Film, User as UserIcon, ShieldAlert, Sparkles, PlusCircle, LogOut } from 'lucide-react';
import { User } from '../types.js';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenRequest: () => void;
  onOpenAi: () => void;
  activeView: 'home' | 'catalog';
  setActiveView: (view: 'home' | 'catalog') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onOpenRequest,
  onOpenAi,
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-md border-b border-white/8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF3B30] to-[#E50914] flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
              Ani<span className="text-[#FF3B30]">Stream</span>
              <span className="text-[10px] font-mono tracking-widest uppercase ml-1.5 px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                VPS
              </span>
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveView('home')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              activeView === 'home' ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Featured
          </button>
          <button
            onClick={() => setActiveView('catalog')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              activeView === 'catalog' ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Catalog
          </button>
          <button
            onClick={onOpenRequest}
            className="cursor-pointer text-slate-400 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-[#FF3B30]" />
            Request Anime
          </button>
          <button
            onClick={onOpenAi}
            className="cursor-pointer text-slate-400 hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            AI Curator
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="cursor-pointer text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap flex items-center gap-1.5 font-semibold"
            >
              <ShieldAlert className="w-4 h-4" />
              Admin Panel
            </button>
          )}
        </nav>

        {/* Zone 3: Search & User Account Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick search input */}
          <div className="relative hidden sm:block w-44 lg:w-56">
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141A23] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF3B30] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141A23] border border-white/10">
                <div className="w-6 h-6 rounded-full bg-[#FF3B30]/20 flex items-center justify-center text-[#FF3B30] font-bold text-xs">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-slate-200 max-w-[90px] truncate">
                  {currentUser.username}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1 rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF3B30] hover:bg-[#E50914] rounded-lg shadow-sm shadow-red-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
