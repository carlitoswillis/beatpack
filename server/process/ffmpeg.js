const fs = require('fs');
const FfmpegCommand = require('fluent-ffmpeg');
const child_process = require('child_process');
const makeCover = require('./makeCover');

const command = new FfmpegCommand();

module.exports = (info, callback) => {
  const { folderPath, name, images, type } = info;
  const imagePath = images.length ? images[Math.floor(Math.random() * images.length)] : info.imagePath;
  const bw = Date.now() % 2 === 0 ? { color: 'black', str: '', textColor: 'white' } : { color: 'white', str: '2', textColor: 'black' };
  const blank = '/Users/carlitoswillis/Documents/graphic sources/blank';
  info.blank = `${blank}${bw.str}.jpg`;
  let read = fs.createReadStream(`${blank}${bw.str}.jpg`);
  let write = fs.createWriteStream(`${folderPath}/blank.jpg`);
  read.pipe(write);
  // read = fs.createReadStream(`${imagePath}`);
  // write = fs.createWriteStream(`${folderPath}/main.jpg`);
  // read.pipe(write);

  makeCover( { type, bw, name, output: `${folderPath}`, input: `${imagePath}` }, (err) => {
    if (err) throw err;
    child_process.exec(`docker run -v "${folderPath}":$(pwd) -w $(pwd)\
    jrottenberg/ffmpeg:3.2-scratch -stats \
    -loop 1 -y -i blank.jpg -i main.jpg -itsoffset 00:00:0.050 -i "${name}.mp3" \
    -filter_complex "[1:v]scale=-1:1080 [ovrl], \
    [0:v][ovrl]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
    -c:v libx264 -tune stillimage -c:a libfdk_aac -vbr 5 -pix_fmt yuv420p -shortest \
    "${name}.mp4" -y`, (err, data) => {
      if (err) throw err;
      callback(null, data);
      // child_process.exec(`docker run -v "${folderPath}":$(pwd) -w $(pwd)\
      // jrottenberg/ffmpeg:4.0 -stats \
      // -i "${name}.mp4" -i thumb.jpg \
      // -filter_complex "[1:v]scale=-1:-1 [ovrl], \
      // [0:v][ovrl]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:enable='between(t,0,.1)" \
      // -pix_fmt yuv420p -c:a copy \
      // "${name}_with_thumb.mp4" -y`, (err, data) => {
      //   if (err) throw err;
      // });
    });
  });

};
