import React, { useRef, useState, useEffect } from 'react';
import { 
  X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, 
  SkipForward, List, HardDrive, AlertCircle 
} from 'lucide-react';
import { Anime, Season, Episode } from '../types.js';

interface VideoPlayerModalProps {
  anime: Anime;
  initialSeasonNumber: number;
  initialEpisode: Episode;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  anime,
  initialSeasonNumber,
  initialEpisode,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentSeasonNumber, setCurrentSeasonNumber] = useState(initialSeasonNumber);
  const [currentEpisode, setCurrentEpisode] = useState<Episode>(initialEpisode);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const currentSeason = anime.seasons.find(s => s.seasonNumber === currentSeasonNumber) || anime.seasons[0];

  // Video stream source URL
  const streamUrl = `/api/stream/${currentEpisode.id}`;

  // Find next episode in current season or next season
  const getNextEpisode = (): { seasonNumber: number; episode: Episode } | null => {
    if (!currentSeason) return null;
    const currentIdx = currentSeason.episodes.findIndex(e => e.id === currentEpisode.id);
    if (currentIdx !== -1 && currentIdx + 1 < currentSeason.episodes.length) {
      return { seasonNumber: currentSeason.seasonNumber, episode: currentSeason.episodes[currentIdx + 1] };
    }
    // Check next season
    const seasonIdx = anime.seasons.findIndex(s => s.seasonNumber === currentSeasonNumber);
    if (seasonIdx !== -1 && seasonIdx + 1 < anime.seasons.length) {
      const nextSeason = anime.seasons[seasonIdx + 1];
      if (nextSeason.episodes.length > 0) {
        return { seasonNumber: nextSeason.seasonNumber, episode: nextSeason.episodes[0] };
      }
    }
    return null;
  };

  const nextEp = getNextEpisode();

  const handleNextEpisode = () => {
    if (nextEp) {
      setCurrentSeasonNumber(nextEp.seasonNumber);
      setCurrentEpisode(nextEp.episode);
      setVideoError(null);
    }
  };

  // Switch to another episode from drawer
  const handleSelectEpisode = (seasonNum: number, ep: Episode) => {
    setCurrentSeasonNumber(seasonNum);
    setCurrentEpisode(ep);
    setVideoError(null);
    setShowDrawer(false);
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(err => {
        console.warn('Playback error:', err);
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekBy(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekBy(10);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume]);

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none overflow-hidden">
      <div 
        ref={containerRef}
        className="relative w-full h-full flex flex-col justify-between bg-black"
      >
        
        {/* Top Floating Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Close Player (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FF3B30]">
                <span>{anime.title}</span>
                <span className="text-white/40">·</span>
                <span>Season {currentSeasonNumber}</span>
                <span className="text-white/40">·</span>
                <span className="font-mono">EP {currentEpisode.episodeNumber}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                {currentEpisode.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md transition-colors cursor-pointer"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Episodes</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative flex-grow flex items-center justify-center w-full h-full">
          <video
            ref={videoRef}
            src={streamUrl}
            autoPlay
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                setVideoError(null);
              }
            }}
            onError={(e) => {
              console.error('Video error event:', e);
              setVideoError('Unable to decode or stream video format directly. Ensure standard MP4/H264 encoding.');
            }}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer max-h-screen"
          />

          {/* Video Error Overlay */}
          {videoError && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-20">
              <AlertCircle className="w-12 h-12 text-[#FF3B30] mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Playback Notice</h3>
              <p className="text-sm text-slate-400 max-w-md mb-4">{videoError}</p>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs font-mono text-slate-300 max-w-lg mb-4 text-left">
                <div>File: {currentEpisode.filename}</div>
                <div>Path: {currentEpisode.relativePath}</div>
                <div>Size: {currentEpisode.formattedSize}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.load();
                      setVideoError(null);
                    }
                  }}
                  className="px-4 py-2 bg-[#FF3B30] text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Retry Stream
                </button>
                {nextEp && (
                  <button
                    onClick={handleNextEpisode}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    Try Next Episode
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 pointer-events-auto">
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-xs font-mono tabular-nums text-slate-300 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) {
                  videoRef.current.currentTime = val;
                }
              }}
              className="flex-grow h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF3B30] hover:h-2 transition-all"
            />
            <span className="text-xs font-mono tabular-nums text-slate-400 w-12 text-left">
              {formatTime(duration)}
            </span>
          </div>

          {/* Control Buttons Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={togglePlay}
                className="p-2 sm:p-2.5 rounded-full bg-[#FF3B30] hover:bg-red-600 text-white transition-transform active:scale-90 cursor-pointer shadow-lg shadow-red-500/20"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => seekBy(-10)}
                className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Rewind 10s (Left Arrow)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => seekBy(10)}
                className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Forward 10s (Right Arrow)"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {nextEp && (
                <button
                  onClick={handleNextEpisode}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                  title="Next Episode"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Next Ep</span>
                </button>
              )}

              {/* Volume Slider */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Mute / Unmute (M)"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-[#FF3B30]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <HardDrive className="w-3.5 h-3.5" />
                {currentEpisode.formattedSize}
              </span>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Fullscreen (F)"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Side Episode Drawer */}
        {showDrawer && (
          <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-[#0B0E14]/95 border-l border-white/10 z-40 p-4 sm:p-6 overflow-y-auto backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="font-bold text-white text-sm">Episodes Drawer</h3>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Seasons list */}
              <div className="space-y-4">
                {anime.seasons.map((season) => (
                  <div key={season.id} className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {season.name}
                    </div>
                    <div className="space-y-1">
                      {season.episodes.map((ep) => {
                        const isCurrent = currentEpisode.id === ep.id;
                        return (
                          <div
                            key={ep.id}
                            onClick={() => handleSelectEpisode(season.seasonNumber, ep)}
                            className={`p-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                              isCurrent
                                ? 'bg-[#FF3B30] text-white font-bold'
                                : 'bg-[#141A23] text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span className="truncate pr-2">
                              EP {ep.episodeNumber}: {ep.title}
                            </span>
                            <span className="font-mono text-[10px] opacity-75 shrink-0">
                              {ep.formattedSize}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] text-slate-500 font-mono text-center">
              AniStream VPS Direct Engine
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
