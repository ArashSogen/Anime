import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Anime, Season, Episode, AnimeRequest, User, ServerSettings } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const ARTWORK_DIR = path.join(DATA_DIR, 'artwork');
const DEMO_DIR = path.join(DATA_DIR, 'demo_anime');

const LIBRARY_FILE = path.join(DATA_DIR, 'library.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ARTWORK_DIR)) fs.mkdirSync(ARTWORK_DIR, { recursive: true });
if (!fs.existsSync(DEMO_DIR)) fs.mkdirSync(DEMO_DIR, { recursive: true });

// Natural alphanumeric collator for sorting seasons and episodes
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

// Default settings
let settings: ServerSettings = {
  storagePath: DEMO_DIR,
  adminKey: 'admin123',
  allowedExtensions: ['.mp4', '.mkv', '.webm', '.mov', '.avi'],
  lastScannedAt: null,
  scanStatus: 'idle',
  scanError: null,
  totalAnimeCount: 0,
  totalEpisodesCount: 0,
};

if (fs.existsSync(SETTINGS_FILE)) {
  try {
    settings = { ...settings, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) };
  } catch (err) {
    console.error('Failed reading settings file:', err);
  }
}

function saveSettings() {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// In-memory state synchronized with JSON disk storage
let library: Anime[] = [];
if (fs.existsSync(LIBRARY_FILE)) {
  try {
    library = JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
  } catch (err) {
    console.error('Failed reading library file:', err);
  }
}

function saveLibrary() {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(library, null, 2), 'utf-8');
  settings.totalAnimeCount = library.length;
  settings.totalEpisodesCount = library.reduce((acc, a) => acc + a.totalEpisodes, 0);
  saveSettings();
}

let requests: AnimeRequest[] = [];
if (fs.existsSync(REQUESTS_FILE)) {
  try {
    requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf-8'));
  } catch (err) {
    console.error('Failed reading requests file:', err);
  }
}

function saveRequests() {
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
}

let users: (User & { passwordHash?: string })[] = [];
if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (err) {
    console.error('Failed reading users file:', err);
  }
} else {
  // Create default admin user
  users = [
    {
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@anistream.local',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

// Helper: Format bytes to human readable string
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper: Extract season number from folder name
function extractSeasonNumber(name: string): number | null {
  const trimmed = name.trim();
  // Pure number e.g. "1", "02"
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  // Season patterns: "Season 1", "S02", "S 3", "Season_4"
  const match = trimmed.match(/(?:season|s)[\s_\-]*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

// Helper: Extract episode number from filename
function extractEpisodeNumber(name: string, fallbackIndex: number): number {
  // Strip extension
  const base = name.replace(/\.[^/.]+$/, '');
  // Match Episode patterns: "Ep 01", "Episode 2", "E03", "- 04 -", " 05 "
  const match = base.match(/(?:episode|ep|e)[\s_\-]*(\d+)/i) ||
                base.match(/(?:^|[\s_\-\[])(\d{1,4})(?:[\s_\-\]v.]|$)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0 && num < 2000) {
      return num;
    }
  }
  return fallbackIndex + 1;
}

// Helper: Clean title for display
function cleanTitle(folderOrFilename: string): string {
  return folderOrFilename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[\[\(].*?[\]\)]/g, '') // remove brackets like [1080p] [Subs]
    .replace(/[_\.]/g, ' ') // replace dots and underscores with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// MIME types lookup
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.mkv': return 'video/x-matroska';
    case '.mov': return 'video/quicktime';
    case '.avi': return 'video/x-msvideo';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

// Create sample demo files so users can test immediately
function createDemoFilesIfEmpty() {
  const sampleFolder = path.join(DEMO_DIR, 'Attack on Titan');
  if (!fs.existsSync(sampleFolder)) {
    try {
      const s1 = path.join(sampleFolder, '1');
      const s2 = path.join(sampleFolder, '2');
      fs.mkdirSync(s1, { recursive: true });
      fs.mkdirSync(s2, { recursive: true });

      // Minimal valid MP4 header (ftyp + moov + mdat) or tiny playable webm stub
      // For immediate preview playback, a minimal lightweight playable mp4 container
      const minimalMp4Base64 = 
        'AAAAHGZ0eXBtcDQyAAAAAW1wNDJpc29tYXZjMQAAADhtb292AAAAbG12aGQAAAAA1mY' +
        'cHNZmHBwAA+gAAAAAAAEAAAEAAAQAAAEAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAA' +
        'AAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAR0cmFr' +
        'AAAAXHRraGQAAAAH1mYcHNZmHBwAAAABAAAAAAAQAABAAAAAAAAAAAAAAAAAAAAAAA' +
        'EAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
        'AAAAAA==';
      const sampleBuffer = Buffer.from(minimalMp4Base64, 'base64');

      fs.writeFileSync(path.join(s1, 'Episode 01 - To You, in 2000 Years.mp4'), sampleBuffer);
      fs.writeFileSync(path.join(s1, 'Episode 02 - That Day.mp4'), sampleBuffer);
      fs.writeFileSync(path.join(s2, 'Episode 01 - Beast Titan.mp4'), sampleBuffer);

      const edgerunners = path.join(DEMO_DIR, 'Cyberpunk Edgerunners', '1');
      fs.mkdirSync(edgerunners, { recursive: true });
      fs.writeFileSync(path.join(edgerunners, 'Episode 01 - Let You Down.mp4'), sampleBuffer);
      fs.writeFileSync(path.join(edgerunners, 'Episode 02 - Like a Boy.mp4'), sampleBuffer);

      const frieren = path.join(DEMO_DIR, 'Frieren Beyond Journeys End');
      fs.mkdirSync(frieren, { recursive: true });
      fs.writeFileSync(path.join(frieren, 'Episode 01 - The Journeys End.mp4'), sampleBuffer);
      fs.writeFileSync(path.join(frieren, 'Episode 02 - It Didnt Have to Be Magic.mp4'), sampleBuffer);
    } catch (err) {
      console.warn('Could not generate demo files:', err);
    }
  }
}

// Scan storage directory on the VPS
async function scanDirectory(targetPath: string): Promise<{ success: boolean; animeCount: number; episodeCount: number; error?: string }> {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Directory does not exist on server: ${targetPath}`);
  }

  const stats = await fs.promises.stat(targetPath);
  if (!stats.isDirectory()) {
    throw new Error(`Specified path is not a directory: ${targetPath}`);
  }

  // Map of existing anime artwork to preserve
  const existingArtwork = new Map<string, { cover?: string | null; banner?: string | null; seasons: Map<string, string | null> }>();
  for (const a of library) {
    const seasonMap = new Map<string, string | null>();
    for (const s of a.seasons) {
      if (s.coverImage) seasonMap.set(s.folderName, s.coverImage);
      if (s.coverImage) seasonMap.set(String(s.seasonNumber), s.coverImage);
    }
    existingArtwork.set(a.folderName, {
      cover: a.coverImage,
      banner: a.bannerImage,
      seasons: seasonMap,
    });
  }

  const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });
  const scannedAnimeList: Anime[] = [];
  let totalEpisodesFound = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue; // skip hidden folders

    const animeFolderName = entry.name;
    const animeDirPath = path.join(targetPath, animeFolderName);
    const animeId = 'ani_' + Buffer.from(animeFolderName).toString('hex').slice(0, 16);

    const subEntries = await fs.promises.readdir(animeDirPath, { withFileTypes: true });

    // Look for numbered or season folders
    const seasonDirs: fs.Dirent[] = [];
    const directVideoFiles: fs.Dirent[] = [];

    for (const sub of subEntries) {
      if (sub.name.startsWith('.')) continue;
      if (sub.isDirectory()) {
        seasonDirs.push(sub);
      } else if (sub.isFile()) {
        const ext = path.extname(sub.name).toLowerCase();
        if (settings.allowedExtensions.includes(ext)) {
          directVideoFiles.push(sub);
        }
      }
    }

    const builtSeasons: Season[] = [];

    // If there are season folders
    if (seasonDirs.length > 0) {
      // Sort season folders numerically
      seasonDirs.sort((a, b) => {
        const numA = extractSeasonNumber(a.name);
        const numB = extractSeasonNumber(b.name);
        if (numA !== null && numB !== null) return numA - numB;
        if (numA !== null) return -1;
        if (numB !== null) return 1;
        return collator.compare(a.name, b.name);
      });

      for (let sIdx = 0; sIdx < seasonDirs.length; sIdx++) {
        const sDir = seasonDirs[sIdx];
        const seasonNum = extractSeasonNumber(sDir.name) ?? (sIdx + 1);
        const seasonPath = path.join(animeDirPath, sDir.name);
        const seasonId = `${animeId}_s${seasonNum}`;

        const seasonFiles = await fs.promises.readdir(seasonPath, { withFileTypes: true });
        const videoFiles = seasonFiles.filter(f => f.isFile() && settings.allowedExtensions.includes(path.extname(f.name).toLowerCase()));

        // Sort episodes using natural collator
        videoFiles.sort((a, b) => collator.compare(a.name, b.name));

        const episodes: Episode[] = [];
        for (let epIdx = 0; epIdx < videoFiles.length; epIdx++) {
          const vFile = videoFiles[epIdx];
          const fullPath = path.join(seasonPath, vFile.name);
          const fStat = await fs.promises.stat(fullPath);
          const epNum = extractEpisodeNumber(vFile.name, epIdx);
          const epId = 'ep_' + Buffer.from(fullPath).toString('hex').slice(0, 20);

          episodes.push({
            id: epId,
            title: cleanTitle(vFile.name),
            episodeNumber: epNum,
            filename: vFile.name,
            relativePath: path.relative(targetPath, fullPath),
            absolutePath: fullPath,
            sizeBytes: fStat.size,
            formattedSize: formatBytes(fStat.size),
            extension: path.extname(vFile.name).toLowerCase(),
          });
        }

        // Secondary sort to ensure sequential episode numbers
        episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

        // Check if cover art exists from previous upload
        const prev = existingArtwork.get(animeFolderName);
        const seasonCover = prev?.seasons.get(sDir.name) || prev?.seasons.get(String(seasonNum)) || null;

        builtSeasons.push({
          id: seasonId,
          seasonNumber: seasonNum,
          name: `Season ${seasonNum}`,
          folderName: sDir.name,
          coverImage: seasonCover,
          episodes,
        });

        totalEpisodesFound += episodes.length;
      }
    }

    // If there were direct video files in the root folder, group into Season 1 if no seasons existed, or as Extras/Season 1
    if (directVideoFiles.length > 0) {
      directVideoFiles.sort((a, b) => collator.compare(a.name, b.name));
      const seasonNum = builtSeasons.length === 0 ? 1 : builtSeasons.length + 1;
      const seasonName = builtSeasons.length === 0 ? 'Season 1' : 'Extras & Specials';
      const seasonId = `${animeId}_s${seasonNum}`;

      const episodes: Episode[] = [];
      for (let epIdx = 0; epIdx < directVideoFiles.length; epIdx++) {
        const vFile = directVideoFiles[epIdx];
        const fullPath = path.join(animeDirPath, vFile.name);
        const fStat = await fs.promises.stat(fullPath);
        const epNum = extractEpisodeNumber(vFile.name, epIdx);
        const epId = 'ep_' + Buffer.from(fullPath).toString('hex').slice(0, 20);

        episodes.push({
          id: epId,
          title: cleanTitle(vFile.name),
          episodeNumber: epNum,
          filename: vFile.name,
          relativePath: path.relative(targetPath, fullPath),
          absolutePath: fullPath,
          sizeBytes: fStat.size,
          formattedSize: formatBytes(fStat.size),
          extension: path.extname(vFile.name).toLowerCase(),
        });
      }

      episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

      const prev = existingArtwork.get(animeFolderName);
      builtSeasons.unshift({
        id: seasonId,
        seasonNumber: seasonNum,
        name: seasonName,
        folderName: builtSeasons.length === 0 ? '.' : 'root',
        coverImage: prev?.seasons.get('1') || null,
        episodes,
      });

      totalEpisodesFound += episodes.length;
    }

    if (builtSeasons.length === 0) continue; // no video content found

    const prevArt = existingArtwork.get(animeFolderName);
    const totalEps = builtSeasons.reduce((acc, s) => acc + s.episodes.length, 0);

    scannedAnimeList.push({
      id: animeId,
      title: cleanTitle(animeFolderName),
      folderName: animeFolderName,
      path: animeDirPath,
      coverImage: prevArt?.cover || null,
      bannerImage: prevArt?.banner || null,
      synopsis: `Stream all seasons of ${cleanTitle(animeFolderName)} directly hosted from high-speed storage.`,
      genres: ['Action', 'Animation', 'Drama'],
      rating: '8.8',
      year: new Date().getFullYear(),
      seasons: builtSeasons,
      totalEpisodes: totalEps,
      scannedAt: new Date().toISOString(),
    });
  }

  // Sort anime by title
  scannedAnimeList.sort((a, b) => collator.compare(a.title, b.title));

  library = scannedAnimeList;
  saveLibrary();

  settings.lastScannedAt = new Date().toISOString();
  settings.scanStatus = 'success';
  settings.scanError = null;
  saveSettings();

  return {
    success: true,
    animeCount: library.length,
    episodeCount: totalEpisodesFound,
  };
}

// Gemini AI client for intelligent anime recommendations with thinking mode
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 50MB for image artwork uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static artwork serving
  app.use('/data/artwork', express.static(ARTWORK_DIR));

  // Initialize demo files if empty & auto-scan
  createDemoFilesIfEmpty();
  if (library.length === 0) {
    try {
      await scanDirectory(settings.storagePath);
    } catch (e) {
      console.warn('Initial auto-scan fallback:', e);
    }
  }

  // --- API Endpoints ---

  // Health / Status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      totalAnime: library.length,
      storagePath: settings.storagePath,
      lastScannedAt: settings.lastScannedAt,
    });
  });

  // Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(settings);
  });

  app.post('/api/admin/settings', (req: Request, res: Response) => {
    const { storagePath, adminKey, allowedExtensions } = req.body;
    if (storagePath) settings.storagePath = storagePath.trim();
    if (adminKey) settings.adminKey = adminKey.trim();
    if (allowedExtensions && Array.isArray(allowedExtensions)) {
      settings.allowedExtensions = allowedExtensions;
    }
    saveSettings();
    res.json({ success: true, settings });
  });

  // Directory Scan Trigger
  app.post('/api/admin/scan', async (req: Request, res: Response) => {
    const targetPath = req.body.storagePath || settings.storagePath;
    try {
      settings.scanStatus = 'scanning';
      saveSettings();
      const result = await scanDirectory(targetPath);
      res.json(result);
    } catch (err: any) {
      settings.scanStatus = 'error';
      settings.scanError = err.message || 'Scan failed';
      saveSettings();
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Seed Demo Content
  app.post('/api/admin/seed-demo', async (req: Request, res: Response) => {
    try {
      createDemoFilesIfEmpty();
      settings.storagePath = DEMO_DIR;
      saveSettings();
      const result = await scanDirectory(DEMO_DIR);
      res.json({ ...result, message: 'Demo media populated and scanned' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get Anime Library
  app.get('/api/anime', (req: Request, res: Response) => {
    res.json(library);
  });

  // Get Single Anime Detail
  app.get('/api/anime/:id', (req: Request, res: Response) => {
    const item = library.find(a => a.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    res.json(item);
  });

  // Artwork Upload Endpoint (Poster, Banner, Season Cover)
  app.post('/api/admin/artwork', async (req: Request, res: Response) => {
    const { animeId, seasonId, type, imageBase64 } = req.body;
    if (!animeId || !imageBase64) {
      return res.status(400).json({ error: 'animeId and imageBase64 are required' });
    }

    const anime = library.find(a => a.id === animeId);
    if (!anime) {
      return res.status(404).json({ error: 'Anime series not found' });
    }

    try {
      // Decode base64
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = '.jpg';

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = '.png';
        if (mime.includes('webp')) ext = '.webp';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(imageBase64, 'base64');
      }

      const filename = `${animeId}_${seasonId ? 's_' + seasonId : 'series'}_${type || 'poster'}_${Date.now()}${ext}`;
      const filePath = path.join(ARTWORK_DIR, filename);

      await fs.promises.writeFile(filePath, buffer);
      const publicUrl = `/data/artwork/${filename}`;

      // Update in library
      if (seasonId) {
        const season = anime.seasons.find(s => s.id === seasonId || String(s.seasonNumber) === seasonId);
        if (season) {
          season.coverImage = publicUrl;
        }
      } else {
        if (type === 'banner') {
          anime.bannerImage = publicUrl;
        } else {
          anime.coverImage = publicUrl;
        }
      }

      saveLibrary();
      res.json({ success: true, url: publicUrl, anime });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed saving image: ' + err.message });
    }
  });

  // Video Streaming Endpoint with HTTP 206 Partial Content (Range Support)
  app.get('/api/stream/:fileId', async (req: Request, res: Response) => {
    const { fileId } = req.params;

    // Find episode by fileId
    let foundEpisode: Episode | null = null;
    for (const a of library) {
      for (const s of a.seasons) {
        for (const ep of s.episodes) {
          if (ep.id === fileId) {
            foundEpisode = ep;
            break;
          }
        }
        if (foundEpisode) break;
      }
      if (foundEpisode) break;
    }

    if (!foundEpisode || !fs.existsSync(foundEpisode.absolutePath)) {
      return res.status(404).json({ error: 'Video file not found on disk' });
    }

    const filePath = foundEpisode.absolutePath;
    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = getMimeType(filePath);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // User Anime Requests
  app.get('/api/requests', (req: Request, res: Response) => {
    // Return requests (admin sees all, sorted by date)
    const sorted = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sorted);
  });

  app.post('/api/requests', (req: Request, res: Response) => {
    const { title, preferredSeason, notes, username, userId } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Anime title is required' });
    }

    const newRequest: AnimeRequest = {
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: userId || 'anonymous',
      username: username || 'Viewer',
      title: title.trim(),
      preferredSeason: preferredSeason ? preferredSeason.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requests.unshift(newRequest);
    saveRequests();
    res.json({ success: true, request: newRequest });
  });

  app.patch('/api/admin/requests/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const reqItem = requests.find(r => r.id === id);
    if (!reqItem) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (status) reqItem.status = status;
    if (adminNotes !== undefined) reqItem.adminNotes = adminNotes;
    reqItem.updatedAt = new Date().toISOString();

    saveRequests();
    res.json({ success: true, request: reqItem });
  });

  app.delete('/api/admin/requests/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    requests = requests.filter(r => r.id !== id);
    saveRequests();
    res.json({ success: true });
  });

  // Authentication & Users
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { username, email, adminKey } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existing = users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    const isAdmin = adminKey && adminKey === settings.adminKey;

    const newUser: User = {
      id: 'usr_' + Date.now(),
      username: cleanUsername,
      email: cleanEmail,
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers();

    res.json({ success: true, user: newUser });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { usernameOrEmail, adminKey } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    const target = usernameOrEmail.trim().toLowerCase();
    let user = users.find(u => u.username.toLowerCase() === target || u.email.toLowerCase() === target);

    // If logging in with admin key for the first time
    if (!user && adminKey === settings.adminKey) {
      user = {
        id: 'usr_' + Date.now(),
        username: usernameOrEmail.trim(),
        email: `${usernameOrEmail.trim()}@anistream.local`,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      saveUsers();
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found. Please sign up.' });
    }

    // Upgrade to admin if valid adminKey supplied
    if (adminKey && adminKey === settings.adminKey && user.role !== 'admin') {
      user.role = 'admin';
      saveUsers();
    }

    res.json({ success: true, user });
  });

  app.get('/api/admin/users', (req: Request, res: Response) => {
    res.json(users);
  });

  // AI Recommendation & Thinking Mode Endpoint
  app.post('/api/ai/recommend', async (req: Request, res: Response) => {
    const { query, userPreferences } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        recommendation: `Based on popular anime trends: Check out Attack on Titan for gripping dark fantasy, Cyberpunk: Edgerunners for high-octane action, or Frieren for thoughtful emotional storytelling!`,
        suggestedTitles: ['Attack on Titan', 'Cyberpunk Edgerunners', 'Frieren Beyond Journeys End'],
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const catalogSummary = library.map(a => `${a.title} (${a.seasons.length} seasons, ${a.totalEpisodes} episodes)`).join(', ');

      const prompt = `You are the master AniStream AI Anime curator. 
User Query / Taste: "${query || 'Recommend something amazing'}"
Scanned Local Catalog on the VPS: [${catalogSummary || 'No local catalog scanned yet'}]
Recent User Anime Requests: [${requests.map(r => r.title).slice(0, 5).join(', ')}]

Provide a thoughtful, nuanced recommendation. If any titles from the local catalog fit, highlight them prominently. Then suggest 2-3 great complementary anime with high reasoning. Keep tone exciting, knowledgeable, and concise.`;

      // Try gemini-4-argon with ThinkingLevel.HIGH as requested in feature block, fallback to gemini-3.8-flash if needed
      let resultText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          },
        });
        resultText = response.text || '';
      } catch (argonErr) {
        console.warn('Falling back to gemini-3.8-flash for recommendations:', argonErr);
        const flashResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        resultText = flashResponse.text || '';
      }

      res.json({ success: true, recommendation: resultText });
    } catch (err: any) {
      res.status(500).json({ error: 'AI recommendation error: ' + err.message });
    }
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serve
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AniStream VPS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to launch AniStream server:', err);
});
