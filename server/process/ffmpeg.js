/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
const fs = require('fs');
const cp = require('child_process');
const makeCover = require('./makeCover');

// const command = new FfmpegCommand();

module.exports = (info, callback) => {
  const {
    folderPath, name, images, type,
  } = info;
  const imagePath = images.length
    ? images[Math.floor(Math.random() * images.length)]
    : info.imagePath;
  const read = fs.createReadStream('/Users/carlitoswillis/Documents/brand graphics/whitebarlogoFS.png');
  const write = fs.createWriteStream(`${folderPath}/barlogo.png`);
  read.pipe(write);

  makeCover({
    type, name, output: `${folderPath}`, input: `${imagePath}`,
  }, (err) => {
    if (err) throw err;
    cp.exec(`docker run -v "${folderPath}":$(pwd) -w $(pwd)\
    jrottenberg/ffmpeg:3.2-scratch -stats \
    -loop 1 -y -i fullscreen.jpg -i barlogo.png -itsoffset 00:00:0.050 -i "${name}.mp3" \
    -filter_complex "[1:v]scale=-1:1080 [ovrl], \
    [0:v][ovrl]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
    -c:v libx264 -tune stillimage -c:a libfdk_aac -vbr 5 -pix_fmt yuv420p -shortest \
    "${name}.mp4" -y`, (err, data) => {
      if (err) throw err;
      fs.unlink(`${folderPath}/fullscreen.jpg`, () => {
        fs.unlink(`${folderPath}/barlogo.png`, () => {
          callback(null);
        });
      });
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
