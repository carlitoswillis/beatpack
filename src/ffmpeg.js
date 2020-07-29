const { fs, path, emitter, command } = require('./imports');
const child_process = require('child_process');

module.exports = (filePath, name, imagePath) => {
  console.log('starting video encoding')
  let readStr = fs.createReadStream('/Users/carlitoswillis/Documents/graphic sources/blank.jpg');
  let writeStr = fs.createWriteStream(`${filePath}/blank.jpg`);
  readStr.pipe(writeStr);
  readStr = fs.createReadStream(`${imagePath}`);
  writeStr = fs.createWriteStream(`${filePath}/main.jpg`);
  readStr.pipe(writeStr);
  child_process.exec(`docker run -v "${filePath}":$(pwd) -w $(pwd)\
  jrottenberg/ffmpeg:3.2-scratch -stats \
  -loop 1 -y -i blank.jpg -i main.jpg -itsoffset 00:00:0.050 -i "${name}.mp3" \
  -filter_complex "[1:v]scale=-1:1080 [ovrl], \
  [0:v][ovrl]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
  -c:v libx264 -tune stillimage -c:a libfdk_aac -vbr 5 -pix_fmt yuv420p -shortest \
  "${name}.mp4" -y`, (err, data) => {
    if (err) throw err;
    console.log('done');
    emitter.emit('done');
  });
};