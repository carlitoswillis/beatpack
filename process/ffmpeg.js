const cp = require('child_process');
const { getVideoDurationInSeconds } = require('get-video-duration');
// const FfmpegCommand = require('fluent-ffmpeg');
// const command = new FfmpegCommand();
module.exports = (info, callback) => {
  const {
    folderPath, name, vidPath, outputPath,
  } = info;
  // cp.exec(`ffmpeg \
  //   -loop 1 -y -i "${info.outputPath}/${name} cover2.png" -itsoffset 00:00:0.050 -i "${folderPath}/${name}.mp3" \
  //   -vf "scale=1080:-1/dar,setsar=1" \
  //   -c:v libx264 -tune stillimage -c:a aac -vbr 5 -pix_fmt yuv420p -shortest \
  //   "${folderPath}/${name}-ig.mp4" -y`, (err) => {
  //   if (err) throw err;
  //   callback(null);
  // });
  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  // console.log(vidPath, vidPath.videoPath);
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
    const commandOne = `ffmpeg -i "${vidPath}" \
    -vf "select='${chops.join('+')}',
        setpts=N/FRAME_RATE/TB" \
    -af "aselect='${chops.join('+')}',
        asetpts=N/SR/TB" "${folderPath}/${name}-chopped.mp4" -y`;
    // const commandOne = duration > 300
    //   ? `ffmpeg -i "${vidPath}" \
    // -vf "select='${chops.join('+')}',
    //     setpts=N/FRAME_RATE/TB" \
    // -af "aselect='between(t,4,6.5)+between(t,17,26)+between(t,74,91)',
    //     asetpts=N/SR/TB" "${folderPath}/${name}-chopped.mp4" -y`
    //   : `cp "${vidPath}" "${folderPath}/${name}-chopped.mp4" -y`;
    cp.exec(commandOne, (err) => {
      if (err) throw err;
      info.event.sender.send('working', 'chopped source');
      // -ss 00:00:01 -i "${vidPath}" -to 00:00:20 \
      cp.exec(`ffmpeg \
    -i "${folderPath}/${name}-chopped.mp4" \
    -itsoffset 00:00:0.050 -i "${outputPath}/${name}.mp3" -shortest \
    -c:v copy -map 0:v:0 -map 1:a:0 \
    "${folderPath}/${name}-dubbed.mp4" -y`, (err) => {
        if (err) throw err;
        info.event.sender.send('working', 'add track to vid');
        cp.exec(`ffmpeg \
    -i "${folderPath}/${name}-dubbed.mp4" \
    -vf "scale=-2:1000,crop=1000:1000" -c:a copy "${folderPath}/${name}-scaled.mp4" -y`, (err) => {
          if (err) throw err;
          info.event.sender.send('working', 'resized video');
          cp.exec(`ffmpeg \
      -i "${folderPath}/${name}-scaled.mp4" \
      -i "${folderPath}/${name} cover3.png" \
      -filter_complex \
      "overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
      -codec:a copy "${folderPath}/${name}-ig.mp4" -y`, (err) => {
            if (err) throw err;
            info.event.sender.send('working', 'added logo + cover');
            callback(null);
            // cp.exec(`ffmpeg \
            // -itsoffset 00:00:0.050 -i "${outputPath}/${name}.mp3" \
            // -f lavfi -i color=s=2560x1440:r=120:color=white  \
            // -filter_complex \
            // "[0:a]aformat=channel_layouts=mono,showwaves=s=1280x720:mode=line:r=30:colors=black[v];[1:v][v]overlay=format=auto:x=(W-w)/2:y=(H-h)/2,format=yuv420p[outv]" -map "[outv]" -map 0:a -c:v libx264 -c:a aac -vbr 5 -shortest "${folderPath}/${name}-sound.mp4" -y`, (err) => {
            //   if (err) throw err;
            //   info.event.sender.send('working', 'sound stuff');
            //   callback(null);
            // });
          });
        });
      });
    });
  });
  // cp.exec(`ffmpeg \
  //   -loop 1 -y -i "${folderPath}/fullscreen.jpg" -itsoffset 00:00:0.050 -i "${folderPath}/${name}.mp3" \
  //   -vf "scale=1920:-1/dar,setsar=1" \
  //   -c:v libx264 -tune stillimage -c:a aac -vbr 5 -pix_fmt yuv420p -shortest \
  //   "${folderPath}/${name}.mp4" -y`, (err) => {
  //   if (err) throw err;
  //   cp.exec(`ffmpeg \
  //   -loop 1 -y -i "${info.outputPath}/${name} cover.jpg" -itsoffset 00:00:0.050 -i "${folderPath}/${name}.mp3" \
  //   -vf "scale=1080:-1/dar,setsar=1" \
  //   -c:v libx264 -tune stillimage -c:a aac -vbr 5 -pix_fmt yuv420p -shortest \
  //   "${folderPath}/${name}-ig.mp4" -y`, (err) => {
  //     if (err) throw err;
  //     callback(null);
  //   });
  // });
};
