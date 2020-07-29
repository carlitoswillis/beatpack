const { fs, path, emitter } = require('./imports');
const encodeMp3 = require('./encode');
const zipFolder = require('./zipfolder');
const ffmpeg = require('./ffmpeg');

let folder, namePath, name, imagePath, single, projects, data;

emitter.on('encode', () => {
  encodeMp3(namePath, name, single);
})
emitter.on('zip', () => {
  zipFolder(namePath, name, single);
})
emitter.on('video', () => {
  ffmpeg(namePath, name, imagePath, single);
})
emitter.on('done', () => {
  // process.exit();
  if (data && projects && projects.length) {
    handleFolder(data, projects);
  }
})

process.stdin.on('data', (input) => {

  namePath = input.toString().replace('\n', '').split(String.fromCharCode(92)).join('');
  name = namePath.split('/').pop();
  emitter.emit('encode');
});

const handleSingle = (info) => {
  namePath = info.folderDrop.replace('\n', '').split(String.fromCharCode(92)).join('');
  name = namePath.split('/').pop();
  imagePath = info.imageDrop.replace('\n', '').split(String.fromCharCode(92)).join('');
  emitter.emit('encode');
}

const handleFolder = (data, projects) => {
  data.folderDrop = projects.pop();
  handleSingle(data);
}

module.exports = (info) => {
  data = info;
  if (info.single) {
    console.log('single mode')
    handleSingle(info);
  } else {
    console.log('bulk mode')
    folder = info.folderDrop.replace('\n', '').split(String.fromCharCode(92)).join('');
    fs.readdir(folder, (err, files) => {
      projects = [];
      for (var f of files) {
        if (fs.statSync(`${folder}/${f}`).isDirectory()) {
          projects.push(`${folder}/${f}`);
        }
      }
      handleFolder(data, projects);
    })
  }
}