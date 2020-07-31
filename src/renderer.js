const { ipcRenderer } = require('electron');
const processFiles = require('../src/process');
const { folder, image, quantityButton, resetButton,
startButton, checkboxes } = require('../src/elements');

let info = { single: true };

const checkboxSet = () => {
  [...checkboxes].forEach((x) => {
    x.addEventListener('click', (e) => {
      info[e.target.id] = e.target.checked;
    });
    info[x.id] = x.checked;
  })
}

const wipe = () => {
  info = { single: info.single };
  for (let element of [folder, image]) {
    element.className = 'dropArea';
  }
}

checkboxSet();

for (let element of [folder, image]) {
  let path;
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    for (let f of e.dataTransfer.files) {
      path = f.path;
    }
    ipcRenderer.send('dragstart', path);
    info[element.id] = path;
    if (e.target.tagName === 'DIV') {
      e.target.className = 'dropArea grayArea';
    }
  });
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.tagName === 'DIV') {
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

quantityButton.addEventListener('click', (e) => {
  info.single = !info.single;
  let [ value, other ] = info.single ? ['Single Mode', 'Bulk Mode'] : ['Bulk Mode', 'Single Mode'];
  document.getElementById('mode').innerText = value;
  document.getElementById('quantityText').innerText = other;
});

resetButton.addEventListener('click', wipe);

startButton.addEventListener('click', (e) => {
  if (info.folderPath && ( info.mp4 && info.imagePath || !info.mp4 )) {
    try {
      processFiles({...info});
    } catch (e) {
      console.error(e);
    }
  }
  wipe();
  checkboxSet();
});

// const inf = {...info, folderPath: '/Users/carlitoswillis/Downloads/test', imagePath: '/Users/carlitoswillis/Downloads/drake.jpg'};
// processFiles(inf);
