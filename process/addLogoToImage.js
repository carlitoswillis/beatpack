const gm = require('gm');

function addLogoToImage({
  logoPath, folderPath, name, outputPath,
}, callback) {
  return gm(`${folderPath}/${name} cropped.jpg`)
    .composite(logoPath)
    .write(`${outputPath}/${name}.jpg`, (err) => {
      if (err) throw err;
      callback(null);
    });
}

module.exports = addLogoToImage;
