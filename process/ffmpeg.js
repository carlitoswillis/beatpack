const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration');

module.exports = (info, callback) => {
  const {
    folderPath, name, vidPath, outputPath,
  } = info;
  const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));
  getVideoDurationInSeconds(vidPath).then((duration) => {
    let seconds = 0;
    const chops = [];
    while (seconds < 75) {
      const start = Math.random();
      const end = getRandomInt(9);
      if ((start * duration + end) < duration) {
        chops.push(`between(t,${start * duration},${start * duration + end})`);
        seconds += end;
      }
    }
    const commandOne = `/usr/local/bin/ffmpeg -i "${vidPath}" \
    -vf "select='${chops.join('+')}',
    setpts=N/FRAME_RATE/TB" \
    -af "aselect='${chops.join('+')}',
    asetpts=N/SR/TB" "${folderPath}/${name}-chopped.mp4" -y`;
    cp.exec(commandOne, (err) => {
      if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
      info.event.sender.send('working', 'chopped source');
      cp.exec(`/usr/local/bin/ffmpeg \
        -i "${folderPath}/${name}-chopped.mp4" \
        -itsoffset 00:00:0.050 -i "${outputPath}/${name}.mp3" -shortest \
        -c:v copy -map 0:v:0 -map 1:a:0 \
        "${folderPath}/${name}-dubbed.mp4" -y`, (err) => {
        if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
        info.event.sender.send('working', 'add track to vid');
        cp.exec(`/usr/local/bin/ffmpeg \
          -i "${folderPath}/${name}-dubbed.mp4" \
          -vf "scale=-2:1000,crop=1000:1000" -c:a copy "${folderPath}/${name}-scaled.mp4" -y`, (err) => {
          if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
          info.event.sender.send('working', 'resized video');
          cp.exec(`/usr/local/bin/ffmpeg \
            -i "${folderPath}/${name}-scaled.mp4" \
            -i "${folderPath}/${name} cover3.png" \
            -filter_complex \
            "overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
            -codec:a copy "${folderPath}/${name}-ig.mp4" -y`, (err) => {
            if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
            info.event.sender.send('working', 'added logo + cover');
            cp.exec(`ffmpeg \
            -loop 1 -y -i "${folderPath}/fullscreen.jpg" -itsoffset 00:00:0.050 -i "${folderPath}/${name}.mp3" \
            -vf "scale=1920:-1/dar,setsar=1" \
            -c:v libx264 -tune stillimage -c:a aac -vbr 5 -pix_fmt yuv420p -shortest \
            "${folderPath}/${name}.mp4" -y`, (err) => {
              if (err) throw err;
              callback(null);
            });
          });
        });
      });
    });
  });
};
