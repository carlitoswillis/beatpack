const { fs, path, emitter } = require('./imports');
const encodeMp3 = require('./encode');
const zipFolder = require('./zipfolder');
const ffmpeg = require('./ffmpeg');

// const namePath = `/Users/carlitoswillis/Downloads/test`
// const name = namePath.split('/').pop();

emitter.on('encode', () => {
  encodeMp3(namePath, name);
})
emitter.on('zip', () => {
  zipFolder(namePath, name);
})
emitter.on('video', () => {
  ffmpeg(namePath, name);
})

// emitter.emit('video');
process.stdout.write('please enter a folder path: \n');
process.stdin.on('data', (input) => {
  const namePath = input.toString();
  const name = namePath.split('/').pop();
  emitter.emit('encode');
  // zipFolder(namePath, name);
  // process.exit();
})
