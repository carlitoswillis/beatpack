const { Lame } = require('node-lame');
const fs = require('fs');

module.exports = (info, callback) => {
  const { name, folderPath, outputPath } = info;
  const mp3Path = `${outputPath}/${name}.mp3`;
  const encoder = new Lame({
    output: mp3Path,
    bitrate: 320,
  }).setFile(`${folderPath}/stems/${name}.wav`);

  encoder
    .encode()
    .then(() => {
      fs.copyFile(`${outputPath}/${name}.mp3`, `${folderPath}/${name}.mp3`, () => {
        callback(null);
      });
    })
    .catch((error) => {
      console.error('something went wrong!', error);
    });
};
