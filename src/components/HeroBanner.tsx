import React from 'react';
import { Play, Info, Image as ImageIcon, Star, Layers, Film } from 'lucide-react';
import { Anime, Episode } from '../types.js';

interface HeroBannerProps {
  anime: Anime | null;
  onPlayEpisode: (anime: Anime, seasonNumber: number, episode: Episode) => void;
  onOpenDetails: (anime: Anime) => void;
  isAdmin: boolean;
  onUploadArtwork: (anime: Anime, type: 'banner' | 'poster') => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  anime,
  onPlayEpisode,
  onOpenDetails,
  isAdmin,
  onUploadArtwork,
}) => {
  if (!anime) {
    return (
      <div className="relative w-full h-[380px] sm:h-[460px] bg-[#141A23] border-b border-white/8 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">No Anime Cataloged Yet</h2>
          <p className="text-sm text-slate-400">
            Open the Admin Panel to configure your VPS storage folder or click "Seed Demo Anime" to begin.
          </p>
        </div>
      </div>
    );
  }

  // Find first available episode to play
  const firstSeason = anime.seasons[0];
  const firstEpisode = firstSeason?.episodes[0];

  const handleQuickPlay = () => {
    if (firstSeason && firstEpisode) {
      onPlayEpisode(anime, firstSeason.seasonNumber, firstEpisode);
    } else {
      onOpenDetails(anime);
    }
  };

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] overflow-hidden select-none border-b border-white/8">
      {/* Background visual or aesthetic gradient mesh */}
      {anime.bannerImage || anime.coverImage ? (
        <img
          src={anime.bannerImage || anime.coverImage || ''}
          alt={anime.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.65] transform scale-105 transition-transform duration-1000"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] via-[#1E1B4B] to-[#31102B] opacity-80" />
      )}

      {/* Atmospheric dark gradient scrims for maximum text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/85 to-transparent w-full md:w-3/4" />

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12 sm:pb-16">
        <div className="max-w-2xl space-y-4">
          
          {/* Clean Unboxed Metadata */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 font-medium tracking-wide">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              {anime.rating || '8.8'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{anime.year || 2024}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              {anime.seasons.length} {anime.seasons.length === 1 ? 'Season' : 'Seasons'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono tabular-nums">{anime.totalEpisodes} Episodes</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400">{anime.genres.join(' / ')}</span>
          </div>

          {/* Series Headline with text-wrap: balance */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight" style={{ textWrap: 'balance' }}>
            {anime.title}
          </h1>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl font-normal">
            {anime.synopsis || `Stream all ${anime.totalEpisodes} episodes of ${anime.title} directly from high-speed VPS storage with zero buffering.`}
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleQuickPlay}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#FF3B30] hover:bg-[#E50914] text-white font-semibold text-sm shadow-lg shadow-red-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => onOpenDetails(anime)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm backdrop-blur-sm transition-colors cursor-pointer border border-white/10"
            >
              <Info className="w-4 h-4 text-slate-300" />
              <span>Details & Seasons</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onUploadArtwork(anime, 'banner')}
                title="Upload custom series banner"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Set Banner</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
