/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
const cp = require('child_process');

// const command = new FfmpegCommand();

module.exports = (info, callback) => {
  const {
    folderPath, name,
  } = info;
  cp.exec(`docker run -v "${folderPath}":$(pwd) -w $(pwd)\
    jrottenberg/ffmpeg:3.2-scratch -stats \
    -loop 1 -y -i fullscreen.jpg -itsoffset 00:00:0.050 -i "${name}.mp3" \
    -vf "scale=1920:-1/dar,setsar=1" \
    -c:v libx264 -tune stillimage -c:a libfdk_aac -vbr 5 -pix_fmt yuv420p -shortest \
    "${name}.mp4" -y`, (err) => {
    if (err) throw err;
    callback(null);
  });
};
