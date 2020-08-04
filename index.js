const electron = require('electron');
const path = require('path');
const url = require('url');
// const server = require('./server');

// server();

const { app, BrowserWindow } = electron;
require('electron-reload')(__dirname);

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
    },
  });
  // mainWindow.loadURL(url.format({
  //   pathname: path.join(__dirname, './public/index.html'),
  //   protocol: 'file:',
  //   slashes: true,
  // }));
  mainWindow.loadURL('http://localhost:5000/beatpack.html');
});
