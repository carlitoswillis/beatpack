const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration');
const getSongDurationInSeconds = require('./getSongDurationInSeconds');

const logError = (err, location = 'ffmpeg') => fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location, err }));

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));

const getPathFromTaskName = ({ taskName, folderPath }) => `${folderPath}/${taskName}.m4v`;
const getChoppedVideoPath = ({ folderPath, name }) => `${folderPath}/${name}-chopped.m4v`;
const getWavPath = ({ folderPath, name }) => `${folderPath}/${name}.wav`;
const getDubbedVideoPath = ({ folderPath, name }) => `${folderPath}/${name}-dubbed.m4v`;
const getScaledVidPath = ({ folderPath, name }) => `${folderPath}/${name}-scaled.m4v`;
const getSquareCoverImagePath = ({ folderPath, name }) => `${folderPath}/${name} cover3.png`;
const getIGOutputPath = ({ outputPath, name }) => `${outputPath}/igvideos/${name}-ig.m4v`;
const getIGOutputPathWithLogo = ({ outputPath, name }) => `${outputPath}/igvideoswithlogo/${name}-ig_with_logo.m4v`;
const getYTOutPath = ({ outputPath, name }) => `${outputPath}/youtubevideos/${name}-YT.m4v`;
const getBlankFullScreenPNG = ({ folderPath }) => `${folderPath}/fullscreen-cover-blank.png`;

const addSongToLoopedVideo = ({ inputVidPath, wavPath, vidOutPath }, callback) => {
  cp.exec(`/usr/local/bin/ffmpeg \
  -stream_loop -1 -i "${inputVidPath}" \
  -itsoffset 00:00:0.000 -i "${wavPath}" -shortest \
  -c:v copy -map 0:v:0 -map 1:a:0 -b:a 384k\
  "${vidOutPath}" -y`, (err, stdout) => {
    // if err ? log it probably...
    // the std out in these ffmpeg cases is particularly useful as opposed to the error itself
    callback(err, vidOutPath);
  });
};

const rescaleVideoAsSquare = ({ inputVidPath, vidOutPath }, callback) => {
  cp.exec(`/usr/local/bin/ffmpeg \
  -i "${inputVidPath}" \
  -vf "scale=-2:1000,crop=1000:1000" \
  -c:a copy "${vidOutPath}" -y`, (err, stdout) => {
    // if err ? log it probably...
    // the std out in these ffmpeg cases is particularly useful as opposed to the error itself
    callback(err, vidOutPath);
  });
};

// const addTransparentOverlayToVideo = ({
//   inputVidPath, imagePathInput, audioDuration, vidOutPath,
// }, callback) => {
//   cp.exec(`/usr/local/bin/ffmpeg \
//     -i "${inputVidPath}" \
//     -i "${imagePathInput}" \
//     -filter_complex \
//     "overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
//     -t 00:00:${audioDuration} \
//     -c:a copy "${vidOutPath}" -y`, callback);
// };

const addTransparentOverlayToVideo = ({
  inputVidPath, imagePathInput, vidOutPath,
}, callback) => {
  cp.exec(`/usr/local/bin/ffmpeg \
    -i "${inputVidPath}" \
    -i "${imagePathInput}" \
    -filter_complex \
    "overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2" \
    -c:a copy "${vidOutPath}" -y`, callback);
};

const addLogoToVideo = addTransparentOverlayToVideo;
const makeWideVideo = addTransparentOverlayToVideo;

const compileVideoTasks = [
  ['addSongToLoopedVideo', addSongToLoopedVideo],
  ['rescaleVideoAsSquare', rescaleVideoAsSquare],
  ['addTransparentOverlayToVideo', addTransparentOverlayToVideo],
  ['addLogoToVideo', addLogoToVideo],
  ['makeWideVideo', makeWideVideo],
];

const compileVideo = ({
  folderPath, name, outputPath, info, audioDuration,
}, callback) => {
  info.event.sender.send('working', 'add track to vid');
  addSongToLoopedVideo({ folderPath, name }, (addSongErr) => {
    if (addSongErr) logError(addSongErr, 'ffmpeg');

    info.event.sender.send('working', 'resize video to square');
    rescaleVideoAsSquare({ folderPath, name }, (rescaleErr) => {
      if (rescaleErr) logError(rescaleErr, 'ffmpeg');

      info.event.sender.send('working', 'add transparent overlay cover');
      addTransparentOverlayToVideo({
        folderPath, name, audioDuration, outputPath,
      }, (coverOverlayErr) => {
        if (coverOverlayErr) logError(coverOverlayErr, 'ffmpeg');

        info.event.sender.send('working', 'add logo to video');
        addLogoToVideo({
          folderPath, name, audioDuration, outputPath,
        }, (addLogoToVideoErr) => {
          if (addLogoToVideoErr) logError(addLogoToVideoErr, 'ffmpeg');

          info.event.sender.send('working', 'make larger video');
          makeWideVideo({ folderPath, name, outputPath }, (makeWideVideoErr) => {
            if (makeWideVideoErr) logError(makeWideVideoErr, 'ffmpeg');
            callback(null);
          });
        });
      });
    });
  });
};

const chopVideo = ({
  audioDuration, videoDuration, shortSectionAsTime,
  vidPath, folderPath, name, info,
}, callback) => {
  const chops = [];
  const usedTimes = new Set();
  const unusedTimes = new Set(new Array(Math.floor(videoDuration)).map((a, i) => i));
  let timesUnchanged = 0;
  while (timesUnchanged < 20) {
    if (!(usedTimes.size < Math.min(audioDuration, videoDuration))) {
      break;
    }
    const start = getRandomInt(videoDuration - shortSectionAsTime);
    const startUnused = !usedTimes.has(Math.floor(start));
    const endUnused = !usedTimes.has(Math.ceil(start + shortSectionAsTime));
    if (startUnused && endUnused) {
      for (let j = Math.floor(start); j < start + shortSectionAsTime; j += 1) {
        usedTimes.add(j);
        unusedTimes.delete(j);
      }
      timesUnchanged = 0;
      chops.push(`between(t,${start},${start + shortSectionAsTime})`);
    }
    timesUnchanged += 1;
  }
  const commandOne = `/usr/local/bin/ffmpeg -i "${vidPath}" \
      -vf "select='${chops.join('+')}',
      setpts=N/FRAME_RATE/TB" \
      -af "aselect='${chops.join('+')}',
      asetpts=N/SR/TB" "${folderPath}/${name}-chopped.m4v" -y`;
  cp.exec(commandOne, (err) => {
    if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
    info.event.sender.send('working', 'chopped source');
    callback(err, `"${folderPath}/${name}-chopped.m4v"`);
  });
};

const makeVideoWithSourceVideo = (info, callback) => {
  const {
    folderPath, name, vidPath, outputPath, bpm,
  } = info;
  const totalBars = 32;
  getSongDurationInSeconds({
    folderPath, name, bpm, totalBars,
  }, (err, audioDuration) => {
    const barsForChopping = 2;
    getVideoDurationInSeconds(vidPath).then((videoDuration) => {
      getSongDurationInSeconds({
        folderPath, name, bpm, barsForChopping,
      }, (err, shortSectionAsTime) => {
        if (err) throw err;
        chopVideo({
          audioDuration,
          videoDuration,
          shortSectionAsTime,
          vidPath,
          folderPath,
          name,
          outputPath,
          info,
        }, (err, vidOutPath) => {
          callback(err, vidOutPath);
        });
      });
    });
  });
};

const makeVideoWithImage = (info, callback) => {
  const {
    folderPath, name, outputPath, imagePath, vidOutPath,
  } = info;
  const imageSource = `${folderPath}/fullscreen-${imagePath ? 'cover' : 'blank'}.jpg`;
  cp.exec(`/usr/local/bin/ffmpeg -i "${imageSource}" -i "${outputPath}/${name}.wav" -b:a 384k "${vidOutPath}" -y`, (err) => {
    if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
    callback(err, vidOutPath);
  });
};

const moveToOutputPath = ({ inputVidPath, name, outputPath }, callback) => {
  fs.copyFileSync(inputVidPath, `${outputPath}/${name}-${new Date().getTime()}.m4v`);
  callback(null);
};

const donothing = (info, cb) => {
  cb();
};

const iterateThroughTasks = (info, callback) => {
  const { tasks, folderPath } = info;
  const [taskName, task] = tasks.pop();
  info.event.sender.send('working', `working on ${taskName}`);
  task({ ...info, vidOutPath: getPathFromTaskName({ folderPath, taskName }) }, (err, out) => {
    console.log(info.vidOutPath, out, taskName);
    if (err) {
      callback(err);
    }
    info.event.sender.send('task-finished', `${taskName}`);
    if (!tasks.length) {
      callback(null);
    } else {
      iterateThroughTasks({ ...info, inputVidPath: out }, callback);
    }
  });
};

module.exports = (info, callback) => {
  const tasks = [['makeVideoWithImage', makeVideoWithImage]];
  if (info.files.videos.length) {
    tasks.pop();
    [['wide', makeVideoWithSourceVideo], ['looping video', addSongToLoopedVideo]].forEach((tuple) => tasks.push(tuple));
  }
  [['square', rescaleVideoAsSquare], ['logo', addLogoToVideo], ['soundwave', donothing]].filter((task) => info[task[0]])
    .forEach((tuple) => tasks.push(tuple));
  tasks.push(['finishing', moveToOutputPath]);
  const vidInfo = {
    ...info,
    tasks: tasks.reverse(),
    wavPath: getWavPath(info),
    vidOutPath: `${info.name}.m4v`,
    imagePathInput: info.square ? getSquareCoverImagePath(info) : getBlankFullScreenPNG(info),
  };
  console.log(tasks);
  iterateThroughTasks(vidInfo, (err) => {
    if (err) throw err;
    callback(null);
  });
};
