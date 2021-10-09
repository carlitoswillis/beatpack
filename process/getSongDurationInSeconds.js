const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const getBeatsPerSecond = (bpm) => bpm / 60;
const getLengthOfABeat = (bpm) => 1 / getBeatsPerSecond(bpm);
const getLengthOfABar = (bpm) => 4 * getLengthOfABeat(bpm);
const getLengthOfBars = (bpm, bars = 24) => bars * getLengthOfABar(bpm);

const getSongDurationInSeconds = ({
  folderPath, name, bpm, bars,
}, callback) => {
  cp.exec(`/usr/local/bin/ffprobe "${folderPath}/${name}.wav"`, (err, something, data) => {
    if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'ffmpeg', err }));
    const duration = data ? data.split('Duration: 00:').pop().split(', bitrate')[0] : '00:60';
    let [minutes, seconds] = duration.split(':').map((t) => parseFloat(t));
    if (minutes) {
      seconds = 60;
    }
    callback(null, Math.min(60, getLengthOfBars(parseFloat(bpm), bars), seconds));
  });
};

module.exports = getSongDurationInSeconds;
