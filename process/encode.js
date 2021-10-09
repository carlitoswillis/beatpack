const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const encode = (info, callback) => {
  const { name, folderPath, outputPath } = info;
  // if the there is no stems folder, consider the current folder the stems folder
  const stemPath = !fs.existsSync(`${folderPath}/stems`) ? `${folderPath}/${name}.wav` : `${folderPath}/stems/${name}.wav`;
  fs.copyFileSync(stemPath, `${outputPath}/${name}.wav`);

  // mp3ify the wav file, and then copy it to the current folder
  cp.exec(`/usr/local/bin/lame "${stemPath}" "${outputPath}/${name}.mp3" -b 320 --disptime 1`, (errLame) => {
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
