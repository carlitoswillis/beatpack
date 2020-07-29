const { fs, path, emitter } = require('./imports');
const encodeMp3 = require('./encode');
const zipFolder = require('./zipfolder');
const ffmpeg = require('./ffmpeg');

let folder, namePath, name, imagePath, single, projects, data;
// mp3
// zip
// mp4
emitter.on('encode', () => {
  if (data.mp3) {
    encodeMp3(namePath, name, single);
  } else {
    console.log('skipping mp3 encode!')
    emitter.emit('zip');
  }
})
emitter.on('zip', () => {
  if (data.zip) {
    zipFolder(namePath, name, single);
  } else {
    console.log('skipping zip!');
    emitter.emit('video');
  }
})
emitter.on('video', () => {
  if (data.mp4) {
    ffmpeg(namePath, name, imagePath, single);
  } else {
    emitter.emit('done');
  }
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
  console.log(info)
  namePath = info.folderDrop.replace('\n', '').split(String.fromCharCode(92)).join('');
  name = namePath.split('/').pop();
  if (info.mp4) {
    imagePath = info.imageDrop.replace('\n', '').split(String.fromCharCode(92)).join('');
  }
  console.log('emitting encode');
  emitter.emit('encode');
}

const handleFolder = (data, projects) => {
  data.folderDrop = projects.pop();
  handleSingle(data);
}

module.exports = (info) => {
  data = info;
  if (data.single) {
    console.log('single mode')
    handleSingle(data);
  } else {
    console.log('bulk mode')
    folder = data.folderDrop.replace('\n', '').split(String.fromCharCode(92)).join('');
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