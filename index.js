const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow } = electron;
require('electron-reload')(__dirname);

const { ipcMain } = electron;

let mainWindow;

app.on('ready', () => {
  // create window
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });
  // load html
  // mainWindow.loadURL(url.format({
  //   pathname: path.join(__dirname, './public/index.html'),
  //   protocol: 'file:',
  //   slashes: true
  // }))
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.openDevTools();
});

ipcMain.on('dragstart', (event, filePath) => {
  // console.log('starting soon');
});
