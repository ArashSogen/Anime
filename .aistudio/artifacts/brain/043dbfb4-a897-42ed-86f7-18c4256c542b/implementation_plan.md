# VPS Anime Streaming & Media Management Hub

A self-hosted, full-stack anime streaming platform and media server designed to run directly on a VPS, scanning local storage folders for anime and numbered seasons, offering custom artwork uploads, user authentication, video streaming with HTTP range scrubbing, and an admin-only anime request portal.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and design decisions are confirmed based on your requirements and preferences:

- **Directory Scanning & Streaming**: Real VPS filesystem traversal (`fs.promises`), automatically cataloging root anime folders, nested numbered seasons (e.g. `Season 1`, `1`, `S02`), and sorting video files (.mp4, .mkv, .webm, .mov) with natural numeric ordering. Video streaming natively supports HTTP 206 Partial Content for smooth seeking and instant scrubbing.
- **Access Control & Roles**: Open registration allowing any viewer to sign up, log in, browse, watch, and submit anime requests immediately. Administrative privileges are unlocked via a dedicated admin credential or role key, providing exclusive access to VPS storage path configuration, rescanning, artwork upload, and request processing.
- **Visual Design**: Sleek modern streaming aesthetic inspired by Crunchyroll and Netflix—deep obsidian canvas (`#0B0E14`), rich dark structural surfaces (`#141A23`), high-intent anime crimson/vermilion accents (`#FF3B30` / `#FA5A36`), crisp unboxed metadata typography, and theater-mode video playback.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms any VPS with media storage into a private, high-performance anime streaming service. The administrator sets a storage directory (e.g. `/media/anime` or `/var/storage/anime`); the system recursively indexes all folders into anime series, identifies numbered subdirectories as seasons, extracts episodes, and provides uploaders for series/season cover artwork. Viewers can sign up, stream episodes with an integrated player, and request anime that only the admin can review.
- **Target Audience / Persona**: Media server owners hosting anime files on their VPS who want to provide a polished streaming experience for friends, family, or communities without third-party bloat.
- **Key Value**: Zero complex dependencies, lightweight single-binary/node service with automatic filesystem synchronization, responsive mobile and desktop viewing, and complete administrative control.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Viewer Authentication & Onboarding**:
   - Visitors land on a sleek streaming showcase. Unauthenticated guests can preview featured titles and are prompted with a fast, instant signup/login modal or page.
   - On signing up, viewers receive immediate access to the catalog, episode guides, watch history, and anime request form.
2. **Catalog Browsing & Discovery**:
   - Dynamic Hero Banner with backdrop imagery, series title, synopsis/genre tags, and "Watch Now" action.
   - "Continue Watching" row remembering playback progress across episodes.
   - Categorized grids: Recently Added, All Series, and Live Search with instant text filtering.
3. **Episode Streaming Experience**:
   - Clicking an anime opens the Series Detail View showing seasons in numeric order (`Season 1`, `Season 2`, etc.), episode lists with durations and file metadata.
   - Built-in cinematic Video Player supporting fullscreen, keyboard shortcuts (Space to play/pause, Left/Right 10s seek, F for fullscreen, M for mute), auto-next episode prompt, and episode drawer.
4. **Viewer Anime Request Modal**:
   - Viewers can click "Request Anime", enter title, year, or notes (e.g., preferred season or sub/dub), and track their request status.
5. **Admin Management Console (Restricted)**:
   - **Storage & Scan Hub**: Configure storage folder paths on the VPS, test directory accessibility, trigger live rescans, and inspect indexing logs.
   - **Artwork Manager**: Drag-and-drop or file upload custom posters and banner images for any detected anime or season.
   - **Anime Requests Desk**: View all user requests sorted by timestamp, with one-click actions: "Acknowledge", "Mark as Added", or "Decline" with optional admin notes.
   - **User Accounts Viewer**: Inspect registered viewers, signup dates, and permissions.

#### Visual Identity & Theme
- **Aesthetic Direction**: Sleek Modern Streaming (Netflix / Crunchyroll-inspired obsidian dark mode).
- **Color Palette**:
  - Dominant Neutral Canvas: `#0B0E14` (Deep Night Canvas)
  - Structural Surfaces & Cards: `#141A23` (Subdued Slate Obsidian)
  - Hairline Borders & Dividers: `rgba(255, 255, 255, 0.08)`
  - Primary Accent: `#FF3B30` / `#FA5A36` (Cinematic Vermilion / Crunchyroll Tangerine)
  - Text Hierarchy: `#F8FAFC` (Headline 100), `#94A3B8` (Muted Body 70), `#64748B` (Subtle 50)
- **Typography & Hierarchy**:
  - Display Font: `Plus Jakarta Sans` or `Outfit` for bold, impactful series titles and brand headers.
  - Body Font: `Public Sans` / `Plus Jakarta Sans` for clean, highly legible episode descriptions and metadata.
  - Telemetry & Numbers: `font-mono tabular-nums` for episode numbers, video timestamps (`23:45`), and file sizes.
- **Anti-Slop Restraint**: Zero decorative glowing green dots, zero code-syntax headers (`// FEAT`), zero pill-badge sandwiches, unboxed metadata separated by quiet interpuncts (`·`).

---

### 3. Key Product Decisions & Trade-Offs

- **Filesystem Traversal Engine**:
  - *Chosen Approach*: Recursive directory scanner with natural alphanumeric sort (`Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })`). Handles folder structures such as:
    ```
    /anime_storage/
      ├── Attack on Titan/
      │     ├── 1/
      │     │    ├── episode_01.mp4
      │     │    └── episode_02.mkv
      │     └── 2/
      │          └── episode_01.mp4
      └── Death Note/
            ├── episode_1.mp4
            └── episode_2.mp4
    ```
  - *Why*: Flawlessly accommodates both numbered season folders (`1`, `2`, `Season 01`) and direct single-season anime without manual naming constraints.
  - *Fallback/Sample Data*: Includes a built-in "Seed Demo Media" toggle so the app runs immediately in dev/preview while allowing admin to enter any real VPS directory path.
- **Video Delivery with HTTP 206 Partial Content**:
  - *Chosen Approach*: Node.js streaming endpoint (`/api/stream/:fileId`) interpreting HTTP `Range` headers to stream video chunks directly from the disk.
  - *Why*: Allows instant scrubbing, timeline hover previews, and low RAM consumption on the VPS.
- **Artwork & Metadata Storage**:
  - *Chosen Approach*: Server data store saving custom uploaded artwork into a local uploads directory (`data/artwork/`), with metadata indexing stored in a resilient JSON database (`data/library.json`).
  - *Why*: Portable, zero database server requirements (runs anywhere Node runs without needing external DB setup), backup-friendly.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VPS Server Architecture                         │
└────────────────────────────────────────────────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  Client (React 19 + Tailwind)│        │   Backend API (Express/Vite) │
│  - Top Bar (Brand, Nav, User)│ ◄────► │  - /api/scan (FS indexer)    │
│  - Hero Feature & Spotlight  │        │  - /api/stream/:id (HTTP 206)│
│  - Catalog & Search Bar      │        │  - /api/upload-artwork       │
│  - Season/Episode Player     │        │  - /api/requests (CRUD)      │
│  - Admin Storage & Requests  │        │  - /api/auth (JWT/session)   │
└──────────────────────────────┘        └──────────────┬───────────────┘
                                                       │
                           ┌───────────────────────────┴──────────────────────────┐
                           ▼                                                      ▼
              ┌──────────────────────────┐                           ┌──────────────────────────┐
              │ VPS Storage Directories  │                           │   Server Data Store      │
              │ - /media/anime/          │                           │   - data/library.json    │
              │ - Scanned video files    │                           │   - data/artwork/        │
              │ - Dynamic path configs   │                           │   - data/requests.json   │
              └──────────────────────────┘                           └──────────────────────────┘
```

#### Key API Routes & Functions:
1. `POST /api/admin/scan`: Scans given storage path on the VPS, updates catalog, detects seasons and episodes.
2. `GET /api/anime`: Returns full indexed anime library with seasons, episodes, and artwork.
3. `GET /api/stream/:fileId`: Serves range-supported video stream directly from the VPS filesystem.
4. `POST /api/admin/artwork`: Uploads custom image (poster or backdrop) for an anime or specific season.
5. `POST /api/requests` & `GET /api/requests`: Submit and review viewer anime requests (admin-only view).
6. `POST /api/auth/register` & `POST /api/auth/login`: User account creation and authentication.

---

### 5. Implementation Phases

1. **Backend Media Scanner & Streamer**: Filesystem scanner, natural sorting, video streaming endpoint with HTTP Range handling, persistent library cache, and artwork upload API.
2. **Authentication & Role System**: User registration, session management, and admin authentication.
3. **Frontend Streaming Experience**: Modern catalog, search/filter, hero showcase, season tabs, episode list, and responsive video player with playback progress memory.
4. **Admin Dashboard**: Storage path configuration, scan trigger with real-time feedback, cover art uploader for series/seasons, and anime requests manager.
5. **Polishing & Verification**: Verified build, smooth transitions, mobile responsiveness, and deployment readiness on VPS.
