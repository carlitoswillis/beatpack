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
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      enableRemoteModule: true,
    },
    frame: false,
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

ipc.on('process-file-selection', (event, data) => {
  const { id, filePaths } = JSON.parse(data);
  const folders = [];
  filePaths.forEach((folderPath) => {
    folders.push(fsPromises.readdir(folderPath));
  });
  Promise.all(folders)
    .then((folder) => {
      const files = folder
        .reduce((f1, f2) => f1.concat(f2), [])
        .filter((name) => name[0] !== '.');
      event.sender.send('processed-files', JSON.stringify({ id, files }));
    });
});
