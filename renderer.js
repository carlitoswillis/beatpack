const { ipcRenderer } = require('electron');
const processFiles = require('./src');

const folder = document.getElementById('folderDrop');
const img = document.getElementById('imageDrop');
const info = {};
for (let element of [folder, img]) {
  let path;
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    for (let f of e.dataTransfer.files) {
      path = f.path;
    }
    ipcRenderer.send('dragstart', path);
    info[element.id] = path;
    if (info.folderDrop && info.imageDrop) {
      try {
        processFiles(info);
      } catch (e) {
        console.log(e)
      }
    }
  });
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  })
}