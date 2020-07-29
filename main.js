const electron = require('electron');
const url = require('url');
const path = require('path');

const { app, BrowserWindow } = electron;
require('electron-reload')(__dirname);

const ipcMain = electron.ipcMain;

let mainWindow;

app.on('ready', function(){
  // create window
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  });
  // load html
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.openDevTools();
})

ipcMain.on('dragstart', (event, filePath) => {
  console.log('starting soon');
})