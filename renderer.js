const { ipcRenderer } = require('electron');
const processFiles = require('./src');

const check = (el) => {
  return el.tagName === 'DIV';
}

const folder = document.getElementById('folderDrop');
const img = document.getElementById('imageDrop');
const toggle = document.getElementById('quantity');
const flush = document.getElementById('flush');
const start = document.getElementById('start');

let info = { single: true };
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
    if (check(e.target)) {
      e.target.className = 'dropArea grayArea';
    }
  });
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (check(e.target)) {
      e.target.className = 'dropArea hoveredDrop'
    }
  });
  element.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (check(e.target)) {
      e.target.className = 'dropArea';
    }
  });
}

toggle.addEventListener('click', (e) => {
  info.single = !info.single;
  let [ value, other ] = info.single ? ['Single Mode', 'Bulk Mode'] : ['Bulk Mode', 'Single Mode'];
  document.getElementById('mode').innerText = value;
  document.getElementById('quantityText').innerText = other;
});


flush.addEventListener('click', (e) => {
  info = { info: info.single };
  for (let element of [folder, img]) {
    element.className = 'dropArea';
  }
});

start.addEventListener('click', (e) => {
  if (info.folderDrop && info.imageDrop) {
    try {
      processFiles(info);
    } catch (e) {
      console.log(e);
    }
  }
});


