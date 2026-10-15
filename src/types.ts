export interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  filename: string;
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
  formattedSize: string;
  extension: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  name: string;
  folderName: string;
  coverImage?: string | null;
  episodes: Episode[];
}

export interface Anime {
  id: string;
  title: string;
  folderName: string;
  path: string;
  coverImage?: string | null;
  bannerImage?: string | null;
  synopsis?: string;
  genres: string[];
  rating?: string;
  year?: number;
  seasons: Season[];
  totalEpisodes: number;
  scannedAt: string;
}

export interface AnimeRequest {
  id: string;
  userId: string;
  username: string;
  title: string;
  preferredSeason?: string;
  notes?: string;
  status: 'pending' | 'in_review' | 'added' | 'declined';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface ServerSettings {
  storagePath: string;
  adminKey: string;
  allowedExtensions: string[];
  lastScannedAt: string | null;
  scanStatus: 'idle' | 'scanning' | 'success' | 'error';
  scanError?: string | null;
  totalAnimeCount: number;
  totalEpisodesCount: number;
}

export interface WatchProgress {
  animeId: string;
  seasonId: string;
  episodeId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  updatedAt: string;
}
