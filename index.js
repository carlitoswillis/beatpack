const electron = require('electron');
const server = require('./server');

server();

const { app, BrowserWindow } = electron;
require('electron-reload')(__dirname);

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.loadURL('http://localhost:5000/loggedin');
  mainWindow.openDevTools();
});
