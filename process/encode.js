const fs = require('fs');
const cp = require('child_process');
const path = require('path');

module.exports = (info, callback) => {
  const { name, folderPath, outputPath } = info;
  cp.exec(`/usr/local/bin/lame "${folderPath}/stems/${name}.wav" "${outputPath}/${name}.mp3" -b 320 --disptime 1`, (err) => {
    if (err) {
      fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'encode', err }));
      callback(err);
    }
    fs.copyFile(`${outputPath}/${name}.mp3`, `${folderPath}/${name}.mp3`, (err) => {
      if (err) {
        fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'encode', err }));
        callback(err);
      }
      callback(null);
    });
  });
};
