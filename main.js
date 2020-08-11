const electron = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

const fsPromises = fs.promises;

const ipc = electron.ipcMain;
const { app, BrowserWindow } = electron;
require('electron-reload')(__dirname);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    minWidth: 600,
    maxWidth: 900,
    minHeight: 600,
    maxHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      enableRemoteModule: true,
    },
    // frame: false,
  });
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './public/beatpack.html'),
    protocol: 'file:',
    slashes: true,
  }));
  // mainWindow.loadURL('http://localhost:5000/beatpack.html');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  // console.log(electron.dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }));
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipc.on('start-processing', (event, info) => {
  event.sender.send('received-message', info);
  console.log(info);
});

const extensions = ['.zip', '.mp4', '.mp3', '.jpg', '.png', '.wav', '.rtf', '.md'];
const includesExtentions = (item, col = extensions) => {
  return col.map((x) => item.includes(x)).reduce((x, y) => x || y, false);
};

/* takes files, tries to clean up folders where stems are placed
and then organizes them into data structures for front end */
ipc.on('process-file-selection', (event, data) => {
  const { filePaths } = JSON.parse(data);
  const id = 'projects';
  const paths = [];
  const folders = [];
  const trackInfo = {};
  filePaths.forEach((folderPath) => {
    const folder = fsPromises.readdir(folderPath);
    paths.push(folderPath);
    folders.push(folder);
  });
  Promise.all(folders)
    .then((values) => {
      const lib = {};
      paths.forEach((name) => {
        lib[name] = [];
      });
      values.forEach((val, idx) => {
        lib[paths[idx]].push(...val.filter((name) => name[0] !== '.' && name !== 'Icon\r' && !includesExtentions(name)));
      });
      Object.keys(lib).forEach((key) => {
        lib[key] = lib[key].map((track, index) => {
          const [beatName, bpmkey] = track.toLowerCase().split(' (prod. barlitxs) ');
          const [bpm, scale] = bpmkey ? bpmkey.split(' bpm ') : [null, null];
          const currTrackInf = {
            path: key, file: track, beatName, bpm, key: scale, trackPath: `${key}/${track}`, index,
          };
          trackInfo[`${key}/${track}`] = currTrackInf;
          return currTrackInf;
        });
      });
      event
        .sender
        .send('processed-files', JSON.stringify({
          id, files: Object.values(lib).reduce((a, b) => a.concat(b), []), lib, trackInfo,
        }));
    });
});

const imgTypes = ['.jpg', '.png', '.svg', '.jpeg', '.gif'];
// takes images and prepares then to be displayed
ipc.on('process-image-selection', (event, data) => {
  const { imagePaths } = JSON.parse(data);
  const id = 'images';
  const paths = [];
  const folders = [];
  const imageLib = { dropped: [] };
  const imgInfo = {};
  imagePaths.forEach((folderPath) => {
    if (fs.lstatSync(folderPath).isDirectory()) {
      const folder = fsPromises.readdir(folderPath);
      paths.push(folderPath);
      folders.push(folder);
    } else if (includesExtentions(folderPath, imgTypes)) {
      imageLib.dropped.push(folderPath);
      const currentImg = {
        folderPath, file: '', imgPath: folderPath, index: 0,
      };
      imgInfo[folderPath] = currentImg;
    }
  });
  Promise.all(folders)
    .then((values) => {
      paths.forEach((name) => {
        imageLib[name] = [];
      });
      values.forEach((val, index) => {
        val.forEach((name) => {
          if (name[0] !== '.' && name !== 'Icon\r' && includesExtentions(name, imgTypes)) {
            imageLib[paths[index]].push(name);
            const currentImg = {
              path: paths[index], file: name, imgPath: `${paths[index]}/${name}`, index,
            };
            imgInfo[`${paths[index]}/${name}`] = currentImg;
          }
        });
      });
      event
        .sender
        .send('processed-images', JSON.stringify({
          id, files: Object.values(imageLib).reduce((a, b) => a.concat(b), []), imageLib, imgInfo,
        }));
    });
});
