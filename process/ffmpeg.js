const cp = require('child_process');
const path = require('path');
const fs = require('fs');
const getSongDurationInSeconds = require('./getSongDurationInSeconds');

// eslint-disable-next-line import/no-dynamic-require
const asyncMap = require(path.resolve(__dirname, 'asyncMapMax'));

const FFMPEG_PATH = '/opt/homebrew/bin/ffmpeg';
const FFPROBE_PATH = '/opt/homebrew/bin/ffprobe';

const getVideoDurationInSeconds = (videoPath) => new Promise((resolve, reject) => {
  cp.execFile(FFPROBE_PATH, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', videoPath], (err, stdout) => {
    if (err) return reject(err);
    resolve(parseFloat(stdout));
  });
});

const logError = (err, location = 'ffmpeg') => fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location, err }));

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));

const addSongToLoopedVideo = ({ folderPath, name }, callback) => {
  cp.execFile(FFMPEG_PATH, [
    '-stream_loop', '-1', '-i', `${folderPath}/${name}-chopped.m4v`,
    '-itsoffset', '00:00:0.000', '-i', `${folderPath}/${name}.wav`, '-shortest',
    '-c:v', 'copy', '-map', '0:v:0', '-map', '1:a:0', '-b:a', '384k',
    `${folderPath}/${name}-dubbed.m4v`, '-y',
  ], callback);
};

const rescaleVideoAsSquare = ({ folderPath, name }, callback) => {
  cp.execFile(FFMPEG_PATH, [
    '-i', `${folderPath}/${name}-dubbed.m4v`,
    '-vf', 'scale=-2:1000,crop=1000:1000', '-c:a', 'copy', `${folderPath}/${name}-scaled.m4v`, '-y',
  ], callback);
};

const addTransparentOverlayToVideo = ({
  folderPath, name, audioDuration, outputPath,
}, callback) => {
  cp.execFile(FFMPEG_PATH, [
    '-i', `${folderPath}/${name}-scaled.m4v`,
    '-i', `${folderPath}/${name} cover3.png`,
    '-filter_complex',
    'overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2',
    '-t', `00:00:${audioDuration}`,
    '-c:a', 'copy', `${outputPath}/igvideos/${name}-ig.m4v`, '-y',
  ], callback);
};

const addLogoToVideo = ({
  folderPath, name, audioDuration, outputPath,
}, callback) => {
  cp.execFile(FFMPEG_PATH, [
    '-i', `${folderPath}/${name}-scaled.m4v`,
    '-i', `${folderPath}/${name} barlogo cover3.png`,
    '-filter_complex',
    'overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2',
    '-t', `00:00:${audioDuration}`,
    '-c:a', 'copy', `${outputPath}/igvideoswithlogo/${name}-ig_with_logo.m4v`, '-y',
  ], callback);
};

const makeWideVideo = ({
  folderPath, name, outputPath,
}, callback) => {
  cp.execFile(FFMPEG_PATH, [
    '-i', `${folderPath}/${name}-dubbed.m4v`,
    '-i', `${folderPath}/fullscreen-cover-blank.png`,
    '-filter_complex',
    'overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2',
    '-c:a', 'copy', `${outputPath}/youtubevideos/${name}-YT.m4v`, '-y',
  ], callback);
};

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
  usedTimes, audioDuration, videoDuration, shortSectionAsTime,
  unusedTimes, chops, vidPath, folderPath, name, outputPath, info,
}, callback) => {
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
  const selectExpr = `select='${chops.join('+')}',setpts=N/FRAME_RATE/TB`;
  const aselectExpr = `aselect='${chops.join('+')}',asetpts=N/SR/TB`;
  cp.execFile(FFMPEG_PATH, [
    '-i', vidPath,
    '-vf', selectExpr,
    '-af', aselectExpr,
    `${folderPath}/${name}-chopped.m4v`, '-y',
  ], (err) => {
    if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
    info.event.sender.send('working', 'chopped source');
    compileVideo({
      folderPath, name, outputPath, info, audioDuration,
    }, callback);
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
    const chops = [];
    const usedTimes = new Set();
    const barsForChopping = 2;
    getVideoDurationInSeconds(vidPath).then((videoDuration) => {
      const unusedTimes = new Set(new Array(Math.floor(videoDuration)).map((a, i) => i));
      getSongDurationInSeconds({
        folderPath, name, bpm, barsForChopping,
      }, (err, shortSectionAsTime) => {
        if (err) throw err;
        chopVideo({
          usedTimes,
          audioDuration,
          videoDuration,
          shortSectionAsTime,
          unusedTimes,
          chops,
          vidPath,
          folderPath,
          name,
          outputPath,
          info,
        }, callback);
      });
    });
  });
};

const makeVideoWithImage = (info, callback) => {
  const {
    folderPath, name, outputPath, bpm, imagePath,
  } = info;
  const bars = 32;
  getSongDurationInSeconds({
    folderPath, name, bpm, bars,
  }, (err, audioDuration) => {
    const imageSource = `${folderPath}/fullscreen-${imagePath ? 'cover' : 'blank'}.jpg`;
    cp.execFile(FFMPEG_PATH, [
      '-i', imageSource, '-i', `${outputPath}/${name}.wav`, '-b:a', '384k', `${folderPath}/${name}-chopped.m4v`, '-y',
    ], (err) => {
      if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
      callback();
    });
  });
};

const emptyFunc = (info, cb) => {
  cb();
};

module.exports = (info, callback) => {
  const tasks = [['wide', info.files.videos.length ? makeVideoWithSourceVideo : makeVideoWithImage], ['no logo', emptyFunc]].concat([['square', emptyFunc], ['logo', emptyFunc], ['soundwave', emptyFunc]].filter((task) => info[task[0]]));
  const vidInfo = { ...info, tasks };
  asyncMap(vidInfo, () => {
    callback();
  });
};
