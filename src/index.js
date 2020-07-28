const { fs, path, emitter } = require('./imports');
const encodeMp3 = require('./encode');
const zipFolder = require('./zipfolder');
const ffmpeg = require('./ffmpeg');

let namePath;
let name;
let imagePath;

emitter.on('encode', () => {
  encodeMp3(namePath, name);
})
emitter.on('zip', () => {
  zipFolder(namePath, name);
})
emitter.on('video', () => {
  ffmpeg(namePath, name, imagePath);
})
emitter.on('done', () => {
  process.exit();
})

process.stdin.on('data', (input) => {

  namePath = input.toString().replace('\n', '').split(String.fromCharCode(92)).join('');
  name = namePath.split('/').pop();
  emitter.emit('encode');
});

module.exports = (info) => {
  namePath = info.folderDrop.replace('\n', '').split(String.fromCharCode(92)).join('');
  name = namePath.split('/').pop();
  imagePath = info.imageDrop.replace('\n', '').split(String.fromCharCode(92)).join('');
  emitter.emit('encode');
}