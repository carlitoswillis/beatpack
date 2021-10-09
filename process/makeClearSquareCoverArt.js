const gm = require('gm');
const path = require('path');

function composeCoverArtTransparency({
  beatName, bpm, key, name, folderPath, logoPath,
}, callback) {
  const positionOne = 30;
  const positionTwo = 160;
  const largeFont = 36;
  const smallFont = 22;
  const distance = 20;

  return gm(logoPath)
    .gravity('North')
    .fontSize(largeFont)
    .font(path.resolve(__dirname, '..', 'public', 'VCR_OSD_MONO_1.001.ttf'))
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
    .write(`${folderPath}/${name} cover3.png`, (err) => {
      if (err) throw err;
      callback(null);
    });
}

module.exports = composeCoverArtTransparency;
