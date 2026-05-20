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
