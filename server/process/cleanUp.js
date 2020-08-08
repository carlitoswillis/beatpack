/* eslint-disable no-console */
const fs = require('fs');

module.exports = (info, callback) => {
  const { outputPath, folderPath, name } = info;
  fs.rename(`${folderPath}/stems/${name}.wav`, `${outputPath}.wav`, () => {
    console.log('Moved wav file!');
    fs.unlink(`${folderPath}/fullscreen.jpg`, () => {
      fs.unlink(`${folderPath}/barlogo.png`, () => {
        fs.rename(`${folderPath}/${name}.mp3`, `${outputPath}/${name}.mp3`, () => {
          console.log('Moved mp3');
          fs.unlink(`${folderPath}/text.jpg`, () => {
            fs.unlink(`${folderPath}/main.jpg`, () => {
              fs.unlink(`${folderPath}/cropped.jpg`, () => {
                fs.unlink(`${folderPath}/bordered.jpg`, () => callback(null));
                fs.unlink(`${folderPath}/thumb.jpg`, () => {
                  console.log('Thumbnail deleted');
                  fs.unlink(`${folderPath}/${name}.mp4`, () => {
                    console.log('Video deleted');
                    console.log('All Done');
                    callback(null);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
