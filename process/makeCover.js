// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)
const gm = require('gm');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');

const randomcolor = () => Math.floor(Math.random() * (10));
const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function colors() {
  const v1 = () => {
    const r = () => getRndInteger(0, 255);
    const g = () => getRndInteger(0, 130);
    const b = () => getRndInteger(175, 255);
    return [r(), g(), b()];
  };
  const v2 = () => {
    const r = () => getRndInteger(205, 255);
    const g = () => getRndInteger(0, 190);
    const b = () => [0, getRndInteger(175, 255)][Date.now() % 2];
    return [r(), g(), b()];
  };
  return [v1, v2][Date.now() % 2]();
}

function addLogoToImage({
  logoPath, folderPath, name, outputPath,
}, callback) {
  return gm(`${folderPath}/${name} cropped.png`)
    .composite(logoPath)
    .write(`${outputPath}/${name}.png`, (err) => {
      if (err) throw err;
      callback(null);
    });
}

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
    .write(`${folderPath}/${name} cropped.png`, function (err) {
      if (err) return console.dir(arguments);
      if (err) fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'makeCover/composeCoverArt', err }));
      return gm(`${folderPath}/${name} cropped.png`)
        .composite(logoPath)
        .write(`${outputPath}/${name}.png`, (err) => {
          if (err) throw err;
          return gm(`${folderPath}/${name} cropped.png`)
            .background('black')
            .extent(1080, 1080)
            .write(`${folderPath}/${name} filled.jpg`, (err) => {
              if (err) throw err;
              callback(null);
            });
        });
    });
}

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

function composeFullScreenArt({
  imagePath, folderPath, dimensions, beatName, bpm, key, colorsnumber, red, green, blue, fullscreenLogoPath,
}, callback) {
  const positionOne = 100;
  const positionTwo = 200;
  const largeFont = 36;
  const smallFont = 22;
  const distance = 20;

  gm(imagePath)
    .gravity('North')
    .resize(dimensions.width <= dimensions.height
      ? 1920
      : null, dimensions.height <= dimensions.width
      ? 1080
      : null)
    .crop(1920, 1080)
    .fontSize(largeFont)
    .font(path.resolve(__dirname, '..', 'public', 'VCR_OSD_MONO_1.001.ttf'))
    .fill('black')
    .gravity('NorthEast')
    .noise('poisson')
    .drawText(60, positionTwo, beatName)
    .fontSize(smallFont)
    .drawText(60, positionTwo + distance, `${bpm} bpm`)
    .drawText(60, positionTwo + distance * 2, key)
    .drawText(60, positionTwo + distance * 3, 'prod. barlitxs')
    .fill('white')
    .fontSize(largeFont)
    .drawText(60, positionOne, beatName)
    .fontSize(smallFont)
    .drawText(60, positionOne + distance, `${bpm} bpm`)
    .drawText(60, positionOne + distance * 2, key)
    .drawText(60, positionOne + distance * 3, 'prod. barlitxs')
    .colors(colorsnumber)
    .gravity('South')
    .colorize(red, green, blue)
    .background('black')
    .extent(1920, 1080)
    .write(`${folderPath}/fullscreen-cover.png`, function (err) {
      if (err) return console.dir(arguments);
      return gm(`${folderPath}/fullscreen-cover.png`)
        .composite(fullscreenLogoPath)
        .write(`${folderPath}/fullscreen.png`, function (err) {
          if (err) return console.dir(arguments);
          return gm(`${folderPath}/fullscreen-cover.png`)
            .write(`${folderPath}/fullscreen-cover.jpg`, function (err) {
              if (err) return console.dir(arguments);
              callback(null);
            });
        });
    });
}

function composeFullScreenTransparentArt({
  imagePath, folderPath, beatName, bpm, key, fullscreenLogoPath,
}, callback) {
  const positionOne = 100;
  const positionTwo = 200;
  const largeFont = 36;
  const smallFont = 22;
  const distance = 20;

  gm(imagePath)
    .gravity('North')
    .fontSize(largeFont)
    .font(path.resolve(__dirname, '..', 'public', 'VCR_OSD_MONO_1.001.ttf'))
    .fill('black')
    .gravity('NorthEast')
    .noise('poisson')
    .drawText(60, positionTwo, beatName)
    .fontSize(smallFont)
    .drawText(60, positionTwo + distance, `${bpm} bpm`)
    .drawText(60, positionTwo + distance * 2, key)
    .drawText(60, positionTwo + distance * 3, 'prod. barlitxs')
    .fill('white')
    .fontSize(largeFont)
    .drawText(60, positionOne, beatName)
    .fontSize(smallFont)
    .drawText(60, positionOne + distance, `${bpm} bpm`)
    .drawText(60, positionOne + distance * 2, key)
    .drawText(60, positionOne + distance * 3, 'prod. barlitxs')
    .gravity('South')
    .write(`${folderPath}/fullscreen-cover-blank.png`, function (err) {
      if (err) return console.dir(arguments);
      return gm(`${folderPath}/fullscreen-cover-blank.png`)
        .composite(fullscreenLogoPath)
        .write(`${folderPath}/fullscreen-blank.png`, function (err) {
          if (err) return console.dir(arguments);
          return gm(`${folderPath}/fullscreen-cover-blank.png`)
            .background('black')
            .extent(1920, 1080)
            .write(`${folderPath}/fullscreen-blank.jpg`, function (err) {
              if (err) return console.dir(arguments);
              callback(null);
            });
        });
    });
}

function composeThumbnail({
  folderPath, imagePath, measure, type, colorsnumber, red, green, blue, colorsArr,
}, callback) {
  return gm(imagePath)
    .gravity('North')
    .resize(null, 1080)
    .crop(800, 1040, 0, 0)
    .gravity('Center')
    .colors(colorsnumber)
    .colorize(red, green, blue)
    .noise('laplacian')
    .borderColor(`rgb(${colorsArr})`)
    .border(20, 20)
    .write(`${folderPath}/bordered.png`, function (err) {
      if (err) return console.dir(arguments);
      return gm(path.resolve(__dirname, '..', 'public', 'typebeat.png'))
        .gravity('North')
        .background(`rgb(${colorsArr})`)
        .extent(1080, 1080)
        .gravity('South')
        .font(path.resolve(__dirname, '..', 'public', 'bebas_neue', 'BebasNeue-Regular.ttf'))
        .fontSize(measure(type))
        .fill(`rgb(${[...colorsArr].map((x) => x * 0.85)})`)
        .stroke(`rgb(${[...colorsArr].map((x) => x * 0.85)})`, 10)
        .drawText(0, measure('Type Beat') * 1, type)
        .fill('white')
        .stroke('none')
        .drawText(-3, measure('Type Beat') * 1.03, type)
        .write(`${folderPath}/text.png`, (err) => {
          if (err) return console.dir(arguments);
          return gm(`${folderPath}/text.png`)
            .append(`${folderPath}/bordered.png`, true)
            .noise('laplacian')
            .write(`${folderPath}/thumb.png`, function (err) {
              if (err) return console.dir(arguments);
              callback(null);
            });
        });
    });
}

const makeCover = (info, callback) => {
  const {
    name, folderPath, type, outputPath, bpm, key, logoPath, fullscreenLogoPath,
  } = info;
  const imagePath = info.imagePath || path.resolve(__dirname, '..', 'public', 'logo.png');
  beatName = info.beatName.toUpperCase();
  const measure = (str) => (2.2639 * 1080) / (str.length + 5);
  const [red, green, blue] = [randomcolor(), randomcolor(), randomcolor()];
  const colorsnumber = getRndInteger(3, 20);
  const colorsArr = colors();
  const dimensions = sizeOf(imagePath);
  composeThumbnail({
    folderPath, imagePath, measure, type, colorsnumber, red, green, blue, colorsArr,
  }, () => {
    info.event.sender.send('working', 'made thumbnail');
    composeFullScreenArt({
      imagePath, folderPath, dimensions, beatName, bpm, key, colorsnumber, red, green, blue, fullscreenLogoPath,
    }, () => {
      composeCoverArt({
        // make transparent cover for video stuff
        folderPath, imagePath, dimensions, colorsnumber, beatName, bpm, key, red, green, blue, outputPath, name, logoPath,
      }, () => {
        info.event.sender.send('working', 'made full screen cover');
        composeCoverArtTransparency({
          // make transparent cover for video stuff
          beatName, bpm, key, outputPath, name, folderPath, logoPath: info.logoPath_default,
        }, () => {
          info.event.sender.send('working', 'made transparent cover art with logo');

          composeFullScreenTransparentArt({
            imagePath: info.fullscreenLogoPath, folderPath, beatName, bpm, key, fullscreenLogoPath,
          }, () => {
            if (logoPath != info.logoPath_defaultlse) {
              composeCoverArtTransparency({
                // make transparent cover for video stuff
                beatName, bpm, key, outputPath, name: `${name} barlogo`, folderPath, logoPath,
              }, () => {
                info.event.sender.send('working', 'made transparent cover art with logo');
                callback(null);
              });
            } else {
              callback(null);
            }
          });
        });
      });
    });
  });
};

module.exports = makeCover;
