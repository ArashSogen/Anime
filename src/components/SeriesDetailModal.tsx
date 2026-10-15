import React, { useState } from 'react';
import { X, Play, Image as ImageIcon, Star, Layers, Film, HardDrive, Calendar } from 'lucide-react';
import { Anime, Season, Episode } from '../types.js';

interface SeriesDetailModalProps {
  anime: Anime | null;
  onClose: () => void;
  onPlayEpisode: (anime: Anime, seasonNumber: number, episode: Episode) => void;
  isAdmin: boolean;
  onUploadArtwork: (anime: Anime, type: 'poster' | 'banner', seasonId?: string) => void;
}

export const SeriesDetailModal: React.FC<SeriesDetailModalProps> = ({
  anime,
  onClose,
  onPlayEpisode,
  isAdmin,
  onUploadArtwork,
}) => {
  if (!anime) return null;

  // Active season state (default to first season)
  const [activeSeasonId, setActiveSeasonId] = useState<string>(
    anime.seasons[0]?.id || ''
  );

  const activeSeason = anime.seasons.find(s => s.id === activeSeasonId) || anime.seasons[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-[#0B0E14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Hero / Backdrop */}
        <div className="relative h-64 sm:h-72 w-full shrink-0 overflow-hidden bg-slate-900">
          {anime.bannerImage || anime.coverImage ? (
            <img
              src={anime.bannerImage || anime.coverImage || ''}
              alt={anime.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-[0.6]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#0F172A] via-[#1E1B4B] to-[#31102B]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-transparent" />

          {/* Banner bottom details */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Small poster thumbnail */}
            <div className="hidden sm:block relative w-24 aspect-[3/4] rounded-lg overflow-hidden border border-white/20 shadow-xl shrink-0 bg-slate-800">
              {anime.coverImage ? (
                <img src={anime.coverImage} alt={anime.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <Film className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-grow">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {anime.rating || '8.8'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {anime.year || 2024}
                </span>
                <span aria-hidden="true">·</span>
                <span>{anime.seasons.length} {anime.seasons.length === 1 ? 'Season' : 'Seasons'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{anime.totalEpisodes} Total Episodes</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {anime.title}
              </h2>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onUploadArtwork(anime, 'poster')}
                  className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-[#FF3B30] text-white text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Series Poster</span>
                </button>
                <button
                  onClick={() => onUploadArtwork(anime, 'banner')}
                  className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-[#FF3B30] text-white text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Series Banner</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Synopsis */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Synopsis</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {anime.synopsis}
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Genres:</span>
              <span>{anime.genres.join(', ')}</span>
            </div>
          </div>

          {/* Numbered Season Tabs */}
          <div className="border-t border-white/8 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF3B30]" />
                <h3 className="text-base font-bold text-white">Seasons (Sorted Numerically)</h3>
              </div>

              {/* Admin Season Artwork upload button */}
              {isAdmin && activeSeason && (
                <button
                  onClick={() => onUploadArtwork(anime, 'poster', activeSeason.id)}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload Image for {activeSeason.name}</span>
                </button>
              )}
            </div>

            {/* Segmented Season Buttons */}
            <div className="flex flex-wrap gap-2 p-1 bg-[#141A23] rounded-xl border border-white/8">
              {anime.seasons.map((season) => {
                const isActive = activeSeason?.id === season.id;
                return (
                  <button
                    key={season.id}
                    onClick={() => setActiveSeasonId(season.id)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#FF3B30] text-white shadow-md shadow-red-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{season.name}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      ({season.episodes.length} eps)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Season Preview & Episode List */}
          {activeSeason && (
            <div className="space-y-4">
              {/* Season Banner / Artwork preview if set */}
              {activeSeason.coverImage && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141A23] border border-white/8">
                  <img
                    src={activeSeason.coverImage}
                    alt={activeSeason.name}
                    className="w-12 h-16 object-cover rounded-lg shrink-0 border border-white/10"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-white">{activeSeason.name} Cover Artwork</h5>
                    <p className="text-[11px] text-slate-400">Custom poster applied to this season</p>
                  </div>
                </div>
              )}

              {/* Episodes Grid/List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Episodes in {activeSeason.name} ({activeSeason.episodes.length})
                </div>

                {activeSeason.episodes.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm bg-[#141A23] rounded-xl border border-white/5">
                    No video files detected in folder: {activeSeason.folderName}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeSeason.episodes.map((episode) => (
                      <div
                        key={episode.id}
                        onClick={() => onPlayEpisode(anime, activeSeason.seasonNumber, episode)}
                        className="group flex items-center justify-between p-3.5 rounded-xl bg-[#141A23] hover:bg-[#1E2634] border border-white/5 hover:border-white/15 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Play circle / Episode number */}
                          <div className="w-10 h-10 rounded-lg bg-black/40 group-hover:bg-[#FF3B30] text-slate-300 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-[#FF3B30] shrink-0">
                                EP {episode.episodeNumber < 10 ? `0${episode.episodeNumber}` : episode.episodeNumber}
                              </span>
                              <h4 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                                {episode.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span className="truncate max-w-[200px] sm:max-w-xs">{episode.filename}</span>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                              <span className="font-mono tabular-nums flex items-center gap-1 text-slate-400">
                                <HardDrive className="w-3 h-3" />
                                {episode.formattedSize}
                              </span>
                              <span aria-hidden="true" className="text-slate-600">·</span>
                              <span className="uppercase text-[10px] font-mono bg-white/5 px-1 py-0.5 rounded text-slate-300">
                                {episode.extension.replace('.', '')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-[#FF3B30] text-slate-300 group-hover:text-white text-xs font-semibold transition-colors shrink-0">
                          <span>Stream</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
