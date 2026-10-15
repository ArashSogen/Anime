import React, { useState } from 'react';
import { 
  X, FolderSearch, Image as ImageIcon, MessageSquareQuote, Users, 
  RefreshCw, CheckCircle, AlertTriangle, Upload, HardDrive, Check, Clock, Trash2, Key 
} from 'lucide-react';
import { Anime, AnimeRequest, ServerSettings, User } from '../types.js';

interface AdminPanelModalProps {
  settings: ServerSettings;
  library: Anime[];
  requests: AnimeRequest[];
  users: User[];
  onClose: () => void;
  onScan: (path: string) => Promise<{ success: boolean; animeCount: number; episodeCount: number; error?: string }>;
  onSeedDemo: () => Promise<void>;
  onUpdateSettings: (newSettings: Partial<ServerSettings>) => Promise<void>;
  onUploadArtwork: (animeId: string, type: 'poster' | 'banner', imageBase64: string, seasonId?: string) => Promise<boolean>;
  onUpdateRequestStatus: (requestId: string, status: 'pending' | 'in_review' | 'added' | 'declined', adminNotes?: string) => Promise<void>;
  onDeleteRequest: (requestId: string) => Promise<void>;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  settings,
  library,
  requests,
  users,
  onClose,
  onScan,
  onSeedDemo,
  onUpdateSettings,
  onUploadArtwork,
  onUpdateRequestStatus,
  onDeleteRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'storage' | 'artwork' | 'requests' | 'users'>('storage');

  // Storage tab state
  const [targetPath, setTargetPath] = useState(settings.storagePath || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ animeCount: number; episodeCount: number } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState(settings.adminKey || 'admin123');

  // Artwork tab state
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>(library[0]?.id || '');
  const [artworkTarget, setArtworkTarget] = useState<'poster' | 'banner' | 'season'>('poster');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploadingArt, setIsUploadingArt] = useState(false);
  const [artSuccess, setArtSuccess] = useState<string | null>(null);

  const selectedAnime = library.find(a => a.id === selectedAnimeId) || library[0];

  // Request tab state
  const [adminNoteInputs, setAdminNoteInputs] = useState<Record<string, string>>({});

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);
    try {
      const res = await onScan(targetPath);
      if (res.success) {
        setScanResult({ animeCount: res.animeCount, episodeCount: res.episodeCount });
      } else {
        setScanError(res.error || 'Directory scan failed');
      }
    } catch (err: any) {
      setScanError(err.message || 'Scan execution error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunSeed = async () => {
    setIsSeeding(true);
    try {
      await onSeedDemo();
      setTargetPath(settings.storagePath);
      setScanResult({ animeCount: library.length, episodeCount: settings.totalEpisodesCount });
    } catch (err: any) {
      setScanError(err.message || 'Failed generating demo media');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSaveAdminKey = async () => {
    await onUpdateSettings({ adminKey: adminKeyInput });
    alert('Admin passphrase key updated successfully.');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setArtSuccess(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveArtwork = async () => {
    if (!selectedAnime || !previewImage) return;
    setIsUploadingArt(true);
    try {
      const type = artworkTarget === 'banner' ? 'banner' : 'poster';
      const seasonId = artworkTarget === 'season' ? selectedSeasonId : undefined;
      const ok = await onUploadArtwork(selectedAnime.id, type, previewImage, seasonId);
      if (ok) {
        setArtSuccess(`Successfully applied custom image to ${selectedAnime.title}!`);
        setPreviewImage(null);
      }
    } catch (err: any) {
      alert('Error uploading image: ' + err.message);
    } finally {
      setIsUploadingArt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-[#0B0E14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#141A23] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>VPS Media Server & Admin Control Panel</span>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Root Admin
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure VPS storage paths, scan folders for anime & seasons, upload custom artwork, and manage viewer requests.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-[#0E131C] border-b border-white/8 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'storage'
                ? 'border-[#FF3B30] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderSearch className="w-4 h-4" />
            <span>1. Storage & Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('artwork')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'artwork'
                ? 'border-[#FF3B30] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Artwork & Posters</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-[#FF3B30] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>3. Viewer Requests</span>
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[10px] font-bold flex items-center justify-center">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-[#FF3B30] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>4. Registered Viewers ({users.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">

          {/* TAB 1: STORAGE & DIRECTORY SCANNER */}
          {activeTab === 'storage' && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-4 rounded-xl bg-[#141A23] border border-white/8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">VPS Storage Directory Path</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter the absolute folder on your server where anime folders are stored (e.g. <code className="text-[#FF3B30]">/media/anime</code> or <code className="text-[#FF3B30]">/var/storage/anime</code>).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={targetPath}
                    onChange={(e) => setTargetPath(e.target.value)}
                    placeholder="/media/anime or /path/to/anime/storage"
                    className="flex-grow bg-[#0B0E14] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#FF3B30]"
                  />
                  <button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="px-5 py-2.5 bg-[#FF3B30] hover:bg-[#E50914] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-red-500/20"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Scanning Folders...' : 'Scan Directory'}</span>
                  </button>
                </div>

                {/* Instant Seed Demo Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Don't have media on disk yet?</span>
                    <span className="text-[11px] text-slate-400">
                      Populates sample folders with multi-season video clips directly into demo storage for instant testing.
                    </span>
                  </div>
                  <button
                    onClick={handleRunSeed}
                    disabled={isSeeding}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-colors shrink-0 cursor-pointer"
                  >
                    {isSeeding ? 'Creating demo files...' : 'Seed Demo Anime'}
                  </button>
                </div>

                {/* Results & Error messaging */}
                {scanResult && (
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Scan complete! Indexed <strong>{scanResult.animeCount} anime series</strong> and <strong>{scanResult.episodeCount} video episodes</strong>.
                    </span>
                  </div>
                )}

                {scanError && (
                  <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{scanError}</span>
                  </div>
                )}
              </div>

              {/* Hierarchy explanation card */}
              <div className="p-4 rounded-xl bg-[#141A23] border border-white/8 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  How Directory Hierarchy Works:
                </h4>
                <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                  <p>• <strong>Anime Level</strong>: Every top-level subfolder in your storage path is automatically recognized as an anime title.</p>
                  <p>• <strong>Season Level</strong>: If an anime folder contains numbered folders (e.g. <code className="text-white">1</code>, <code className="text-white">2</code>, <code className="text-white">Season 1</code>, <code className="text-white">Season 2</code>), they are automatically organized and sorted numerically on the site.</p>
                  <p>• <strong>Episode Level</strong>: Video files (<code className="text-white">.mp4, .mkv, .webm, .mov</code>) inside seasons are naturally sorted by episode number.</p>
                </div>
              </div>

              {/* Admin key security configuration */}
              <div className="p-4 rounded-xl bg-[#141A23] border border-white/8 space-y-3">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Admin Passphrase Key</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminKeyInput}
                    onChange={(e) => setAdminKeyInput(e.target.value)}
                    className="flex-grow bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleSaveAdminKey}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    Update Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARTWORK & POSTERS MANAGER */}
          {activeTab === 'artwork' && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-4 rounded-xl bg-[#141A23] border border-white/8 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Upload Custom Artwork</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload high-res poster images or backdrop banners for any detected anime or specific season.
                  </p>
                </div>

                {library.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    No anime found yet. Run a directory scan in Tab 1 first.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Step A: Select Anime */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Select Anime Series:</label>
                      <select
                        value={selectedAnime?.id}
                        onChange={(e) => {
                          setSelectedAnimeId(e.target.value);
                          setPreviewImage(null);
                          setArtSuccess(null);
                        }}
                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF3B30]"
                      >
                        {library.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({a.seasons.length} seasons, {a.totalEpisodes} eps)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step B: Target (Series Poster, Series Banner, Season Cover) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Artwork Target:</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setArtworkTarget('poster')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            artworkTarget === 'poster'
                              ? 'bg-[#FF3B30] text-white'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          Series Poster (3:4)
                        </button>
                        <button
                          type="button"
                          onClick={() => setArtworkTarget('banner')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            artworkTarget === 'banner'
                              ? 'bg-[#FF3B30] text-white'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          Series Banner / Backdrop (16:9)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setArtworkTarget('season');
                            if (selectedAnime?.seasons[0]) {
                              setSelectedSeasonId(selectedAnime.seasons[0].id);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            artworkTarget === 'season'
                              ? 'bg-[#FF3B30] text-white'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          Specific Season Cover
                        </button>
                      </div>
                    </div>

                    {/* If target is specific season */}
                    {artworkTarget === 'season' && selectedAnime && (
                      <div className="space-y-1.5 p-3 rounded-lg bg-black/40 border border-white/5">
                        <label className="text-xs font-semibold text-slate-300">Choose Season:</label>
                        <select
                          value={selectedSeasonId}
                          onChange={(e) => setSelectedSeasonId(e.target.value)}
                          className="w-full bg-[#0B0E14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          {selectedAnime.seasons.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.episodes.length} episodes)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Step C: File input & Preview */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">Choose Image File (JPG, PNG, WebP):</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                      />
                    </div>

                    {previewImage && (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-28 aspect-[3/4] overflow-hidden rounded-lg border border-white/20 shrink-0">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-white block">Ready to Apply:</span>
                          <p className="text-[11px] text-slate-400">
                            This image will be stored in <code className="text-white">/data/artwork/</code> and permanently mapped to {selectedAnime.title} {artworkTarget === 'season' ? `(${artworkTarget})` : ''}.
                          </p>
                          <button
                            onClick={handleSaveArtwork}
                            disabled={isUploadingArt}
                            className="px-4 py-2 bg-[#FF3B30] hover:bg-[#E50914] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingArt ? 'Saving Image...' : 'Save & Apply Image'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {artSuccess && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{artSuccess}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VIEWER ANIME REQUESTS DESK */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Viewer Anime Requests Desk</h3>
                  <p className="text-xs text-slate-400">
                    Review what viewers want added to your VPS storage. These requests are only visible to you.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                  Total Requests: {requests.length}
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs bg-[#141A23] rounded-xl border border-white/5">
                  No anime requests submitted by viewers yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-[#141A23] border border-white/8 hover:border-white/15 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{req.title}</h4>
                          {req.preferredSeason && (
                            <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                              {req.preferredSeason}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              req.status === 'added'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : req.status === 'in_review'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : req.status === 'declined'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-slate-700/50 text-slate-300'
                            }`}
                          >
                            {req.status.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="text-slate-500">Requested by:</span>
                        <span className="font-semibold text-white">{req.username}</span>
                        {req.notes && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400 italic">"{req.notes}"</span>
                          </>
                        )}
                      </div>

                      {/* Admin quick status updater */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                        <span className="text-[11px] text-slate-400 font-medium">Update Status:</span>
                        <button
                          onClick={() => onUpdateRequestStatus(req.id, 'in_review', adminNoteInputs[req.id])}
                          className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          In Review
                        </button>
                        <button
                          onClick={() => onUpdateRequestStatus(req.id, 'added', 'Added to VPS storage! Available to stream.')}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Mark as Added
                        </button>
                        <button
                          onClick={() => onUpdateRequestStatus(req.id, 'declined', adminNoteInputs[req.id])}
                          className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Decline
                        </button>

                        <button
                          onClick={() => onDeleteRequest(req.id)}
                          title="Delete Request"
                          className="p-1 text-slate-500 hover:text-red-400 ml-auto transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {req.adminNotes && (
                        <div className="text-[11px] text-amber-300/80 bg-amber-500/5 p-2 rounded border border-amber-500/10">
                          <strong>Admin note:</strong> {req.adminNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REGISTERED VIEWERS */}
          {activeTab === 'users' && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Registered Viewers</h3>
                  <p className="text-xs text-slate-400">
                    Users signed up to watch anime and submit requests on your VPS server.
                  </p>
                </div>
              </div>

              <div className="border border-white/8 rounded-xl overflow-hidden bg-[#141A23]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/40 text-slate-400 border-b border-white/8">
                    <tr>
                      <th className="p-3 font-semibold">User</th>
                      <th className="p-3 font-semibold">Email</th>
                      <th className="p-3 font-semibold">Role</th>
                      <th className="p-3 font-semibold text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-medium text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.username}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">{u.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
