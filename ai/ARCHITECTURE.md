# Architecture

PURPOSE: Technical system design and data flow of the Beatpack application.

## Overview
Beatpack is a desktop application designed to automate the post-production workflow for music producers. It handles stem zipping, MP3 conversion, cover art generation, video creation, and YouTube uploading in a streamlined pipeline.

## System Components

### 1. Frontend (Renderer Process)
- **Technology**: React (v16), Webpack (v4), Vanilla CSS.
- **Entry Point**: `app/beatpack.jsx` -> `app/components/app.jsx`.
- **Functionality**: User interface for file selection (projects, images, videos), configuration of metadata (BPM, Key, Producer), and triggering the processing pipeline. Communicates with the main process via Electron IPC.

### 2. Main Process (Backend)
- **Technology**: Electron (v9), Node.js.
- **Entry Point**: `main.js`.
- **Functionality**: 
  - Manages application lifecycle and windows.
  - Handles file system operations (listing directories, reading/writing settings).
  - Orchestrates the processing pipeline via IPC events (`process-file-selection`, `start`, etc.).
  - Invokes core processing modules in `process/`.

### 3. Core Processing Pipeline (`process/`)
- **Orchestration**: `process/index.js` and `process/asyncMapMax.js`.
- **Tasks**:
  - **Zipping**: `process/zipfolder.js` (using `archiver`).
  - **Encoding**: `process/encode.js` (MP3 conversion using `node-lame` or `fluent-ffmpeg`).
  - **Cover Art**: `process/makeCover.js` (using `graphicsmagick`).
  - **Video Generation**: `process/ffmpeg.js` (using `fluent-ffmpeg` to combine audio and image/video).
  - **Uploading**: `process/upload.js` (YouTube upload via `googleapis` or `node-apiless-youtube-upload`).
  - **Cleanup**: `process/cleanUp.js` (removes temporary files).

### 4. Settings & Configuration
- **Storage**: JSON files in `settings/` (`default.json`, `info.json`).
- **Persistence**: Main process reads/writes these files based on IPC events.

## Data Flow
1. **Selection**: User drops folders/files. Frontend sends paths to Main.
2. **Analysis**: Main analyzes paths, extracts metadata (e.g., "Beat Name (prod. Producer) 120 bpm Cmaj"), and returns structured data to Frontend.
3. **Trigger**: User starts the process. Frontend sends configuration to Main.
4. **Execution**: Main iterates through projects, calling the processing pipeline for each.
5. **Feedback**: IPC messages update the UI on progress (e.g., `starting-track`, `finished-track`).

## AI Workspace Substrate
Located in `/ai`:
- `AGENTS.md`: Authoritative rules for AI assistants.
- `ARCHITECTURE.md`: This document.
- `PROJECT_STATE.md`: Current focus and task tracking.
- `ai-context.sh`: Script to generate a context bundle for AI.
