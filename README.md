# beatpack

This app automates tedious tasks and solves the problem of the 'Type Beat' producer. Stem zipping, mp3 generation, cover art + logo overlaying, and splicing videos together with the track in the background. This app handles the rest so you can focus on the fun parts.
Created using Electron, and React this desktop application works on any platform to enhance the workflow of sonic artists seeking to increase their production speed.

## Prerequisites

### 1. System Dependencies
This app relies on several media processing binaries. On macOS, the easiest way to install them is via [Homebrew](https://brew.sh/):

```bash
brew install ffmpeg graphicsmagick lame
```

### 2. Environment
- **Node.js**: v12.x is recommended, but v17+ works with the legacy OpenSSL provider flag (included in scripts).
- **Architecture**: Supports Apple Silicon (M1/M2/M3) and Intel.

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

## Built With

* [node.js](https://nodejs.org/en/)
* [React](https://reactjs.org/)
* [Electron](https://www.electronjs.org/)
* [FFmpeg](https://ffmpeg.org/)
* [GraphicsMagick](http://www.graphicsmagick.org/)
