/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

module.exports = (info, callback) => {
  const { outputPath, folderPath, name } = info;
  const unlink = [`${folderPath}/${name}-chopped.mp4`, `${outputPath}/${name} cover2.png`, `${folderPath}/${name} cover3.png`, `${folderPath}/${name}-scaled.mp4`, `${folderPath}/fullscreen.jpg`, `${folderPath}/text.jpg`, `${folderPath}/cropped.jpg`, `${folderPath}/bordered.jpg`, `${folderPath}/thumb.jpg`, `${folderPath}/${name}.mp3`];
  fs.renameSync(`${folderPath}/${name}-dubbed.mp4`, `${outputPath}/${name}-dubbed.mp4`);
  fs.renameSync(`${folderPath}/${name}-ig.mp4`, `${outputPath}/${name}-ig.mp4`);
  fs.renameSync(`${folderPath}/${name}.mp4`, `${outputPath}/${name}.mp4`);
  fs.copyFileSync(`${folderPath}/stems/${name}.wav`, `${outputPath}/${name}.wav`);
  // `${folderPath}/main.jpg`
  // `${folderPath}/${name}.mp4`
  // `${folderPath}/barlogo.png`
  // `${folderPath}/${name}-dubbed.mp4`
  unlink.forEach((file) => {
    try {
      fs.unlinkSync(file);
    } catch (e) {
      fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'cleanup', args: file, e }));
    }
  });
  callback(null);
};
