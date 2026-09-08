const fs = require('fs');
const cp = require('child_process');
const path = require('path');

// Was '/opt/homebrew/bin/lame'. ffmpeg's libmp3lame IS the LAME library --
// linked in rather than shelled out to -- and this ffmpeg is built
// --enable-libmp3lame, so this is the same encoder, not a comparable one.
// `-b:a 320k` reproduces lame's `-b 320` CBR. Verified: encoding the same
// wav both ways gives mp3 / 320000 bps / 44100 Hz / 2ch / same duration.
// The dropped `--disptime 1` only set lame's progress-meter refresh
// interval and has no encode-quality effect, so it has no equivalent here.
// Net: one fewer native binary for users to install, and one fewer
// hardcoded absolute path.
const FFMPEG_PATH = '/opt/homebrew/bin/ffmpeg';

const encode = (info, callback) => {
  const { name, folderPath, outputPath } = info;
  // if the there is no stems folder, consider the current folder the stems folder
  const stemPath = !fs.existsSync(`${folderPath}/stems`) ? `${folderPath}/${name}.wav` : `${folderPath}/stems/${name}.wav`;
  fs.copyFileSync(stemPath, `${outputPath}/${name}.wav`);

  // mp3ify the wav file, and then copy it to the current folder
  cp.execFile(FFMPEG_PATH, ['-i', stemPath, '-c:a', 'libmp3lame', '-b:a', '320k', `${outputPath}/${name}.mp3`, '-y'], (errLame) => {
    if (errLame) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'encode', errLame }));
    if (errLame) callback(errLame);
    fs.copyFile(`${outputPath}/${name}.mp3`, `${folderPath}/${name}.mp3`, (errCopyMP3) => {
      if (errCopyMP3) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'encode', errCopyMP3 }));
      if (errCopyMP3) callback(errCopyMP3);
      callback(null);
    });
  });
};

module.exports = encode;
