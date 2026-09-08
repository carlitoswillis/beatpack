# AI Context Bundle
Generated: Wed May 20 12:11:00 PDT 2026

## ⚠️ Agent Navigation Guide
1. Start with the **Current State** below to understand the focus.
2. Check **Active Tasks** for your specific assignment.
3. Only read files from the repository structure that are directly related to those tasks.
4. Do NOT perform full repository scans unless the task is an architectural audit.

## 1. Authoritative Rules (AGENTS.md)
# Agent Guidelines (AGENTS.md)

PURPOSE: This is the authoritative rulebook for AI assistants. It defines the 'how' and 'what' of the codebase.

## Project Context
- **Objective**: Automate music production post-processing (Zip, MP3, Video, YouTube).
- **Stack**: Electron (Main), React (Renderer), FFmpeg, GraphicsMagick.

## Architecture Constraints
- **Main/Renderer Split**: Keep UI logic in `app/` and system/processing logic in `process/` or `main.js`.
- **IPC Protocol**: All communication between processes must use Electron's `ipcMain` and `ipcRenderer`.
- **Processing Pipeline**: Follow the sequence in `process/index.js`. Do not bypass the `asyncMapMax` orchestration.
- **Markdown Persistence**: All project state and AI-specific documentation must be tracked in `/ai/*.md`.

## Coding Conventions
- **Explicit over Implicit**: Avoid hidden logic, reflection, or complex inheritance.
- **Verification First**: All changes must be verified via tests (if available) or by dry-running the logic.
- **Compact Context**: Keep context files task-scoped and minimal.
- **FFmpeg/GM**: Ensure commands are compatible with the local environment (Mac/Linux/Win).

## How to Navigate This Workspace (Priority Flow)
To minimize token waste and maximize focus, follow this priority sequence:
1. **START HERE**: Read `ai/PROJECT_STATE.md`. It defines the current high-level objective.
2. **Operational Rules**: Read `ai/AGENTS.md` (this file). Adhere strictly to these constraints.
3. **Architecture**: Read `ai/ARCHITECTURE.md` to understand system components and data flow.
4. **Self-Correction**: If you feel your understanding of the project state is out of sync, you may run `./ai/ai-context.sh` to refresh your local context bundle (`CONTEXT_BUNDLE.md`).

## 2. Architecture (ARCHITECTURE.md)
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
- **Technology**: Electron (v13), Node.js.
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
  - **Encoding**: `process/encode.js` (MP3 conversion by shelling out to a hardcoded `/opt/homebrew/bin/lame` via `child_process.execFile`, not the `node-lame`/`fluent-ffmpeg` packages).
  - **Cover Art**: `process/makeCover.js` (using `graphicsmagick`).
  - **Video Generation**: `process/ffmpeg.js` (shells out to a hardcoded `/opt/homebrew/bin/ffmpeg`/`ffprobe` via `child_process.execFile`, not `fluent-ffmpeg`, to combine audio and image/video).
  - **Uploading**: `process/upload.js` (writes track metadata to `trackinfo.csv` via `csv-write-stream`; YouTube upload is not implemented).
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

## 3. Project State (PROJECT_STATE.md)
# Project State

## Current Focus
- [x] Initial codebase analysis and architecture mapping.
- [ ] Stabilizing AI documentation substrate (`/ai/*.md`).
- [ ] Fixing and verifying the context bundle script (`ai/ai-context.sh`).

## Active Tasks
- [x] Update `ai/ARCHITECTURE.md`.
- [ ] Update `ai/PROJECT_STATE.md`.
- [ ] Update `ai/AGENTS.md`.
- [ ] Fix `ai/ai-context.sh` paths.
- [ ] Generate initial `CONTEXT_BUNDLE.md`.

## Backlog
- [ ] **Dependency Update**: Many dependencies (Electron, React, Webpack) are outdated and may have security vulnerabilities or compatibility issues.
- [ ] **Error Handling**: Improve robustness of the FFmpeg and YouTube upload pipelines.
- [ ] **UI Refresh**: Modernize the React UI and improve feedback during the processing phase.
- [ ] **Testing**: Increase coverage for core processing modules in `process/`.

## Completed
- [x] Project initialization and basic automation features.
- [x] Basic Electron wrapper and IPC setup.
- [x] Core processing modules (Zip, MP3, Video, Upload).

## 4. Repository Structure
```text
.
./clear.css
./settings
./settings/savedInfo.json
./settings/info.json
./settings/default.json
./index.html
./app
./app/components
./app/beatpack.jsx
./styles.css
./jest.config.js
./tests
./tests/testInfo.js
./tests/zip.test.js
./tests/mp3.test.js
./tests/cleanup.test.js
./tests/makeCover.test.js
./tests/getSongDurationInSeconds.test.js
./tests/sanitize.test.js
./tests/nmtest.js
./tests/mp4.test.js
./tests/upload.test.js
./ffmpeg analyze audio.js
./server
./server/index.js
./server/testing.js
./webpack.config.js
./youtube
./youtube/auth.js
./youtube/quickstart.js
./README.md
./main.js
./beatpack.js
./public
./public/clear.css
./public/typebeatOG.png
./public/index.html
./public/typebeat2.png
./public/styles.css
./public/bundle.js
./public/electron-tabs.css
./public/index.js
./public/beatpack.html
./public/fullscreen-logo.png
./public/youtube.html
./public/spotify.js
./public/beatpack.gif
./public/beatpack.js
./public/spotify.html
./public/logo.png
./public/fullscreen-logo-default.png
./public/icons
./public/bebas_neue
./public/typebeat.png
./public/VCR_OSD_MONO_1.001.ttf
./public/logo_bar.png
./public/dragula.css
./package-lock.json
./package.json
./CONTEXT_BUNDLE.md
./ai
./ai/ai-context.sh
./ai/ARCHITECTURE.md
./ai/PROJECT_STATE.md
./ai/AGENTS.md
./views
./views/index.ejs
./views/script.js
./views/success.ejs
./views/style.css
./assets
./assets/giphy.gif
./assets/folder.jpg
./assets/icons
./process
./process/order.js
./process/asyncMapMax.js
./process/cleanUp.js
./process/imports.js
./process/zipfolder.js
./process/ffmpeg.js
./process/addLogoToImage.js
./process/makeClearSquareCoverArt.js
./process/index.js
./process/upload.js
./process/upload_old.js
./process/encode.js
./process/makeSquareCoverArt.js
./process/orderin notes.txt
./process/sanitize.js
./process/operations.js
./process/makeCover.js
./process/ffmpeg notes
./process/sanitizeImports.js
./process/getSongDurationInSeconds.js
./process/showwaves.js
```

## 5. Recent Git Changes (Summary)
```text
3c4a6fd Merge branch 'master' of https://github.com/carlitoswillis/beatpack into master
b5dd14a added time synced video chopping and fixed video removal bug
82ef190 Update README.md
ff9d51d add play
533c768 Merge branch 'master' of https://github.com/carlitoswillis/beatpack into master
```

## 6. Active Diff
```diff
diff --git a/.DS_Store b/.DS_Store
index 0f59703..df3fd80 100644
Binary files a/.DS_Store and b/.DS_Store differ
```
