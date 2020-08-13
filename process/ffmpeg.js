const cp = require('child_process');
// const FfmpegCommand = require('fluent-ffmpeg');
// const command = new FfmpegCommand();
module.exports = (info, callback) => {
  const {
    folderPath, name,
  } = info;
  cp.exec(`ffmpeg \
    -loop 1 -y -i "${folderPath}/fullscreen.jpg" -itsoffset 00:00:0.050 -i "${folderPath}/${name}.mp3" \
    -vf "scale=1920:-1/dar,setsar=1" \
    -c:v libx264 -tune stillimage -c:a aac -vbr 5 -pix_fmt yuv420p -shortest \
    "${folderPath}/${name}.mp4" -y`, (err) => {
    if (err) throw err;
    callback(null);
  });
};
