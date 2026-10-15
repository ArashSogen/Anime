import React from 'react';
import { Play, Image as ImageIcon, Film } from 'lucide-react';
import { Anime } from '../types.js';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
  isAdmin: boolean;
  onUploadPoster: (anime: Anime) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  onSelect,
  isAdmin,
  onUploadPoster,
}) => {
  return (
    <div className="group relative flex flex-col rounded-xl bg-[#141A23] border border-white/8 overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1">
      {/* 3:4 Poster Container */}
      <div 
        onClick={() => onSelect(anime)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900 cursor-pointer"
      >
        {anime.coverImage ? (
          <img
            src={anime.coverImage}
            alt={anime.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          /* Styled Fallback Container (Zero-Broken-Image Policy) */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#111827] text-center select-none relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FF3B30_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-[#FF3B30]">
              <Film className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-white tracking-wider line-clamp-2 px-2 uppercase">
              {anime.title}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-1">
              {anime.seasons.length} {anime.seasons.length === 1 ? 'SEASON' : 'SEASONS'}
            </span>
          </div>
        )}

        {/* Hover play gradient scrim & play button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#FF3B30] text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Admin upload artwork button overlay */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUploadPoster(anime);
            }}
            title="Upload custom poster image"
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-[#FF3B30] text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer border border-white/10"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Series Metadata Container */}
      <div 
        onClick={() => onSelect(anime)}
        className="p-3.5 flex flex-col flex-grow justify-between cursor-pointer"
      >
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-[#FF3B30] transition-colors line-clamp-1">
            {anime.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-medium">
            <span>{anime.seasons.length} {anime.seasons.length === 1 ? 'Season' : 'Seasons'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono tabular-nums">{anime.totalEpisodes} Eps</span>
          </div>
        </div>

        {anime.genres && anime.genres.length > 0 && (
          <div className="text-[11px] text-slate-500 mt-2 truncate">
            {anime.genres.slice(0, 2).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
};
