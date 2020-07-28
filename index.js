const { fs, path, emitter } = require('./imports');
const encodeMp3 = require('./encode');
const zipFolder = require('./zipfolder');
const ffmpeg = require('./ffmpeg');

let namePath;
let name;

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
// process.stdout.write('please enter a folder path:');

// namePath = '/Users/carlitoswillis/Google\ Drive\ \(carlitoswillis@berkeley.edu\)/Track\ Outs/2019/12.\ December/massachusetts\ ave\ \(prod.\ barlitxs\)\ 150\ bpm\ F\ minor\ Project'
// name = namePath.split('/').pop();
// emitter.emit('video');

// emitter.emit('encode');

process.stdin.on('data', (input) => {
  namePath = input.toString().replace('\n', '').split(String.fromCharCode(92) + ' ').join('%20');
  name = namePath.split('/').pop();
  emitter.emit('encode');
});

//file:///Users/carlitoswillis/Google%20Drive%20(carlitoswillis@berkeley.edu)/Track%20Outs/2019/12.%20December/massachusetts%20ave%20(prod.%20barlitxs)%20150%20bpm%20F%20minor%20Project/

// /Users/carlitoswillis/Google%20%Drive%20%(carlitoswillis@berkeley.edu)/Track%20%Outs/2019/12.%20%December/massachusetts%20%ave%20%(prod.%20%barlitxs)%20%150%20%bpm%20%F%20%minor%20%Project/
