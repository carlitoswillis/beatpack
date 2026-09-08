const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const FFPROBE_PATH = '/opt/homebrew/bin/ffprobe';

const getBeatsPerSecond = (bpm) => bpm / 60;
const getLengthOfABeat = (bpm) => 1 / getBeatsPerSecond(bpm);
const getLengthOfABar = (bpm) => 4 * getLengthOfABeat(bpm);
const getLengthOfBars = (bpm, bars = 24) => bars * getLengthOfABar(bpm);

const getSongDurationInSeconds = ({
  folderPath, name, bpm, bars,
}, callback) => {
  cp.execFile(FFPROBE_PATH, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', `${folderPath}/${name}.wav`], (err, stdout) => {
    if (err) {
      fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
      return callback(null, Math.min(60, getLengthOfBars(parseFloat(bpm), bars)));
    }
    const seconds = parseFloat(stdout) || 60;
    callback(null, Math.min(60, getLengthOfBars(parseFloat(bpm), bars), seconds));
  });
};

module.exports = getSongDurationInSeconds;
