import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { HeroBanner } from './components/HeroBanner.js';
import { AnimeCard } from './components/AnimeCard.js';
import { SeriesDetailModal } from './components/SeriesDetailModal.js';
import { VideoPlayerModal } from './components/VideoPlayerModal.js';
import { AdminPanelModal } from './components/AdminPanelModal.js';
import { RequestModal } from './components/RequestModal.js';
import { AuthModal } from './components/AuthModal.js';
import { AiAdvisorModal } from './components/AiAdvisorModal.js';
import { Anime, Episode, ServerSettings, AnimeRequest, User } from './types.js';
import { Film, Search, HardDrive, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react';

export default function App() {
  const [library, setLibrary] = useState<Anime[]>([]);
  const [settings, setSettings] = useState<ServerSettings>({
    storagePath: '',
    adminKey: 'admin123',
    allowedExtensions: ['.mp4', '.mkv', '.webm', '.mov', '.avi'],
    lastScannedAt: null,
    scanStatus: 'idle',
    totalAnimeCount: 0,
    totalEpisodesCount: 0,
  });
  const [requests, setRequests] = useState<AnimeRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // View state
  const [activeView, setActiveView] = useState<'home' | 'catalog'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [playingVideo, setPlayingVideo] = useState<{
    anime: Anime;
    seasonNumber: number;
    episode: Episode;
  } | null>(null);

  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [animeRes, settingsRes, reqRes] = await Promise.all([
        fetch('/api/anime'),
        fetch('/api/settings'),
        fetch('/api/requests'),
      ]);

      if (animeRes.ok) {
        const data = await animeRes.json();
        setLibrary(data);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed fetching data:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.warn('Could not fetch users:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
    loadUsers();

    // Check stored user in localStorage
    const savedUser = localStorage.getItem('anistream_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Update localStorage when user changes
  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('anistream_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('anistream_user');
    }
  };

  const handleLogout = () => {
    handleSetCurrentUser(null);
  };

  // Auth Handlers
  const handleLogin = async (usernameOrEmail: string, adminKey?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, adminKey }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      handleSetCurrentUser(data.user);
      loadUsers();
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || 'Login failed' };
  };

  const handleRegister = async (username: string, email: string, adminKey?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, adminKey }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      handleSetCurrentUser(data.user);
      loadUsers();
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || 'Registration failed' };
  };

  // Admin Actions
  const handleScan = async (path: string) => {
    const res = await fetch('/api/admin/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath: path }),
    });
    const data = await res.json();
    if (data.success) {
      await loadInitialData();
    }
    return data;
  };

  const handleSeedDemo = async () => {
    const res = await fetch('/api/admin/seed-demo', { method: 'POST' });
    if (res.ok) {
      await loadInitialData();
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ServerSettings>) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    }
  };

  const handleUploadArtwork = async (
    animeId: string,
    type: 'poster' | 'banner',
    imageBase64: string,
    seasonId?: string
  ): Promise<boolean> => {
    const res = await fetch('/api/admin/artwork', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animeId, type, imageBase64, seasonId }),
    });
    if (res.ok) {
      await loadInitialData();
      // If active series detail is open, update its reference
      if (selectedAnime && selectedAnime.id === animeId) {
        const updated = await fetch(`/api/anime/${animeId}`);
        if (updated.ok) {
          const uData = await updated.json();
          setSelectedAnime(uData);
        }
      }
      return true;
    }
    return false;
  };

  const handleUpdateRequestStatus = async (
    requestId: string,
    status: 'pending' | 'in_review' | 'added' | 'declined',
    adminNotes?: string
  ) => {
    const res = await fetch(`/api/admin/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes }),
    });
    if (res.ok) {
      const reqRes = await fetch('/api/requests');
      if (reqRes.ok) setRequests(await reqRes.json());
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    const res = await fetch(`/api/admin/requests/${requestId}`, { method: 'DELETE' });
    if (res.ok) {
      setRequests(requests.filter(r => r.id !== requestId));
    }
  };

  // User Actions
  const handleSubmitRequest = async (title: string, preferredSeason?: string, notes?: string) => {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        preferredSeason,
        notes,
        userId: currentUser?.id,
        username: currentUser?.username,
      }),
    });
    if (res.ok) {
      const reqRes = await fetch('/api/requests');
      if (reqRes.ok) setRequests(await reqRes.json());
      return true;
    }
    return false;
  };

  const handlePlayEpisode = (anime: Anime, seasonNumber: number, episode: Episode) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setPlayingVideo({ anime, seasonNumber, episode });
  };

  // Filtered Anime List
  const filteredAnime = library.filter((a) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(query) ||
      a.genres.some(g => g.toLowerCase().includes(query)) ||
      a.folderName.toLowerCase().includes(query)
    );
  });

  const featuredAnime = library[0] || null;
  const userRequests = currentUser
    ? requests.filter(r => r.userId === currentUser.id)
    : [];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col selection:bg-[#FF3B30] selection:text-white">
      {/* 1. Header Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenRequest={() => setShowRequestModal(true)}
        onOpenAi={() => setShowAiModal(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* If searching or catalog view selected */}
        {searchQuery.trim() || activeView === 'catalog' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-white">
                  {searchQuery.trim() ? `Search Results for "${searchQuery}"` : 'Complete Anime Catalog'}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {filteredAnime.length} {filteredAnime.length === 1 ? 'series' : 'series'} indexed from VPS storage
                </p>
              </div>

              {/* Quick action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#FF3B30]" />
                  <span>Request Title</span>
                </button>
              </div>
            </div>

            {filteredAnime.length === 0 ? (
              <div className="py-20 text-center space-y-3 bg-[#141A23] rounded-2xl border border-white/5">
                <Search className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Anime Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `No titles matching "${searchQuery}" were found. Try another query or submit a request.`
                    : 'Your VPS storage has not been scanned yet. Open the Admin Panel to configure storage.'}
                </p>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => setShowAdminModal(true)}
                    className="px-4 py-2 bg-[#FF3B30] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Open Storage Scanner
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {filteredAnime.map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    onSelect={(a) => setSelectedAnime(a)}
                    isAdmin={currentUser?.role === 'admin'}
                    onUploadPoster={(a) => {
                      setSelectedAnime(a);
                      setShowAdminModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Home Featured View */
          <div className="space-y-10 pb-16">
            {/* Cinematic Hero Spotlight */}
            <HeroBanner
              anime={featuredAnime}
              onPlayEpisode={handlePlayEpisode}
              onOpenDetails={(a) => setSelectedAnime(a)}
              isAdmin={currentUser?.role === 'admin'}
              onUploadArtwork={() => setShowAdminModal(true)}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              {/* Storage Quick Summary Strip */}
              <div className="p-4 rounded-xl bg-[#141A23] border border-white/8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FF3B30]">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      VPS Storage Status
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {settings.storagePath ? settings.storagePath : 'Path unconfigured'} · {library.length} series · {settings.totalEpisodesCount} total episodes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Assistant</span>
                  </button>

                  {currentUser?.role === 'admin' ? (
                    <button
                      onClick={() => setShowAdminModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#FF3B30] hover:bg-[#E50914] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Admin Hub</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#FF3B30]" />
                      <span>Request Anime</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Shelf: All Scanned Series */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Available on this Server
                    </h2>
                    <p className="text-xs text-slate-400">
                      Organized with numbered seasons and instant high-speed streaming
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('catalog')}
                    className="text-xs font-semibold text-[#FF3B30] hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>

                {library.length === 0 ? (
                  <div className="py-16 text-center space-y-4 bg-[#141A23] rounded-2xl border border-white/5">
                    <Film className="w-12 h-12 text-slate-600 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-white">No Folders Scanned Yet</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        Use the Admin Panel to specify your VPS media folder, or click below to populate sample anime folders for immediate testing.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleSeedDemo}
                        className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg border border-white/10 transition-colors cursor-pointer"
                      >
                        Seed Demo Anime Folders
                      </button>
                      <button
                        onClick={() => setShowAdminModal(true)}
                        className="px-4 py-2 bg-[#FF3B30] hover:bg-[#E50914] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Open Admin Scanner
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {library.map((anime) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        onSelect={(a) => setSelectedAnime(a)}
                        isAdmin={currentUser?.role === 'admin'}
                        onUploadPoster={() => setShowAdminModal(true)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 bg-[#0B0E14] text-xs text-slate-500 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">
              Ani<span className="text-[#FF3B30]">Stream</span>
            </span>
            <span>·</span>
            <span>Self-Hosted VPS Anime Media Server</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span>HTTP 206 Partial Content</span>
            <span>·</span>
            <span>Automatic Season Sorting</span>
            <span>·</span>
            <span>Custom Artwork Engine</span>
          </div>
        </div>
      </footer>

      {/* Series Detail Modal */}
      {selectedAnime && (
        <SeriesDetailModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          onPlayEpisode={handlePlayEpisode}
          isAdmin={currentUser?.role === 'admin'}
          onUploadArtwork={() => {
            setSelectedAnime(null);
            setShowAdminModal(true);
          }}
        />
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <VideoPlayerModal
          anime={playingVideo.anime}
          initialSeasonNumber={playingVideo.seasonNumber}
          initialEpisode={playingVideo.episode}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminModal && (
        <AdminPanelModal
          settings={settings}
          library={library}
          requests={requests}
          users={users}
          onClose={() => setShowAdminModal(false)}
          onScan={handleScan}
          onSeedDemo={handleSeedDemo}
          onUpdateSettings={handleUpdateSettings}
          onUploadArtwork={handleUploadArtwork}
          onUpdateRequestStatus={handleUpdateRequestStatus}
          onDeleteRequest={handleDeleteRequest}
        />
      )}

      {/* Viewer Request Modal */}
      {showRequestModal && (
        <RequestModal
          currentUser={currentUser}
          userRequests={userRequests}
          onClose={() => setShowRequestModal(false)}
          onSubmitRequest={handleSubmitRequest}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      {/* User Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {/* AI Advisor Modal */}
      {showAiModal && (
        <AiAdvisorModal
          onClose={() => setShowAiModal(false)}
          onRequestAnime={(title) => {
            setShowAiModal(false);
            setShowRequestModal(true);
          }}
        />
      )}
    </div>
  );
}
