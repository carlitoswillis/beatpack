# beatpack

This app automates tedious tasks and solves the problem of the 'Type Beat' producer. Stem zipping, mp3 generation, cover art + logo overlaying, and splicing videos together with the track in the background. This app handles the rest so you can focus on the fun parts.
Created using Electron, and React this desktop application enhances the workflow of sonic artists seeking to increase their production speed.

## Prerequisites

### 1. System Dependencies
This app relies on several media processing binaries. On macOS, the easiest way to install them is via [Homebrew](https://brew.sh/):

```bash
brew install ffmpeg graphicsmagick
```

### 2. Environment
- **Node.js**: v12.x is recommended, but v17+ works with the legacy OpenSSL provider flag (included in scripts).
- **Architecture**: macOS on Apple Silicon only — `process/ffmpeg.js`, `process/encode.js`, and `process/getSongDurationInSeconds.js` hardcode `/opt/homebrew/bin/...` paths for ffmpeg/ffprobe, so Intel Mac, Windows, and Linux builds will not find those binaries.

## Installing

1. **Clone the repo**
2. **Install Node dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

## Running the App

### 1. Build the Frontend
You must build the React bundle before starting the app:
```bash
npm run build:dev
```

### 2. Start Electron
In a new terminal tab, run:
```bash
npm start
```

## License

BeatPack itself is released under the ISC License -- see [LICENSE](LICENSE).

## Third-party components

### Media binaries are NOT bundled -- and must stay that way

BeatPack executes `ffmpeg`, `ffprobe` and GraphicsMagick (`gm`) by
absolute path via `child_process.execFile`. It **ships none of them**. You
install them yourself with the `brew install` line above. That distinction
is doing real legal work:

- The Homebrew ffmpeg this project targets is built `--enable-gpl
  --enable-version3`, i.e. **GPLv3**.
- LAME is no longer invoked as a separate binary: mp3 encoding now goes
  through ffmpeg's `libmp3lame`, which is the LAME library linked into
  ffmpeg (LGPLv2), not a different encoder.
- GraphicsMagick is MIT-style; the `gm` npm wrapper is MIT.

Because the app only *invokes* user-installed binaries and distributes
none of them, no copyleft obligation attaches to BeatPack.

> **The line not to cross:** copying ffmpeg into
> `release-builds/`, into the packaged `.app`, or anywhere else that gets
> distributed would make the entire distributed Electron application
> **GPLv3-encumbered**. Do not vendor these binaries. If bundling ever
> becomes a requirement, that is a licensing decision to make
> deliberately, not a build-script convenience.

For the same reason `get-video-duration` was removed: it pulled
`@ffprobe-installer/ffprobe` (LGPL-2.1), whose optional dependencies are
**prebuilt ffprobe binaries**, which would have been bundled.

Standing check -- no tracked file should be a native executable:

```bash
git ls-files | xargs file | grep -iE 'Mach-O|ELF |PE32'   # must print nothing
```

### Consequence: macOS / Apple Silicon only

Those absolute `/opt/homebrew/bin/...` paths are hardcoded in
`process/ffmpeg.js`, `process/encode.js` and
`process/getSongDurationInSeconds.js`. The packaged app therefore only
works on Apple Silicon macOS, whatever `package-win` and `package-linux`
emit.

### Fonts and vendored assets

- `public/bebas_neue/` -- Bebas Neue, SIL Open Font License 1.1
  (`OFL.txt`, `OFL-FAQ.txt` ship alongside it).
- `public/VCR_OSD_MONO_1.001.ttf` -- **license unresolved.** The font
  carries no copyright, license description or license URL in its own
  `name` table, and no license file was ever committed beside it. See
  `public/VCR_OSD_MONO.LICENSE-STATUS.txt`. This needs a human decision.
- `views/script.js` -- bootstrap-tagsinput, MIT, Copyright (c) 2013 Tim
  Schlechter. Vendored; attribution was stripped and has been restored.
- `public/dragula.css`, `public/electron-tabs.css` -- MIT stylesheets
  vendored from those packages; attribution restored.

### ffmpeg recipes

Scratch ffmpeg commands live in `docs/ffmpeg-recipes.sh`. They previously
used the non-free `libfdk_aac` encoder, which requires an
`--enable-nonfree` ffmpeg build that is **not redistributable**. They now
use the free `aac_at` (AudioToolbox) encoder; the rationale and
measurements are in that file's header.

## Built With

* [node.js](https://nodejs.org/en/)
* [React](https://reactjs.org/)
* [Electron](https://www.electronjs.org/)
* [FFmpeg](https://ffmpeg.org/)
* [GraphicsMagick](http://www.graphicsmagick.org/)
