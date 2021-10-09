// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)
const gm = require('gm');
const fs = require('fs');
const path = require('path');

function composeCoverArt({
  folderPath, imagePath, dimensions, colorsnumber, beatName, bpm,
  key, red, green, blue, outputPath, name, logoPath,
}, callback) {
  const positionOne = 30;
  const positionTwo = 160;
  const largeFont = 36;
  const smallFont = 22;
  const distance = 20;

  return gm(imagePath)
    .gravity('North')
    .resize(dimensions.width <= dimensions.height
      ? 1000
      : null, dimensions.height <= dimensions.width
      ? 1000
      : null)
    .crop(1000, 1000, 0, 0)
    .colors(colorsnumber)
    .noise('poisson')
    .font(path.resolve(__dirname, '..', 'public', 'VCR_OSD_MONO_1.001.ttf'))
    .fontSize(largeFont)
    .fill('black')
    .gravity('NorthEast')
    .drawText(10, positionTwo, beatName)
    .fontSize(smallFont)
    .drawText(10, positionTwo + distance, `${bpm} bpm`)
    .drawText(10, positionTwo + distance * 2, key)
    .drawText(10, positionTwo + distance * 3, 'prod. barlitxs')
    .fill('white')
    .fontSize(largeFont)
    .drawText(10, positionOne, beatName)
    .fontSize(smallFont)
    .drawText(10, positionOne + distance, `${bpm} bpm`)
    .drawText(10, positionOne + distance * 2, key)
    .drawText(10, positionOne + distance * 3, 'prod. barlitxs')
    .gravity('South')
    .colorize(red, green, blue)
    .write(`${folderPath}/${name} cropped.jpg`, function (err) {
      if (err) return console.dir(arguments);
      if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'makeCover/composeCoverArt', err }));
      return gm(`${folderPath}/${name} cropped.jpg`)
        .composite(logoPath)
        .write(`${outputPath}/${name}.jpg`, (err) => {
          if (err) throw err;
          callback(null);
        });
    });
}

module.exports = composeCoverArt;
