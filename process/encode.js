const { Lame } = require('node-lame');

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
      callback(null);
    })
    .catch((error) => {
      console.error('something went wrong!', error);
    });
};