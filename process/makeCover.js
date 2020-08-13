/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-shadow */
/* eslint-disable prefer-rest-params */
// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)
const gm = require('gm');
const sizeOf = require('image-size');

function randomcolor() {
  return Math.floor(Math.random() * (10));
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
  return Date.now() % 2 === 0 ? v1() : v2();
}

function composeCoverArt({
  folderPath, imagePath, dimensions, colorsnumber, beatName, bpm,
  key, red, green, blue, outputPath, name,
}, callback) {
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
    .fontSize(36)
    .fill('black')
    .gravity('NorthEast')
    .drawText(60, 270, beatName)
    .fontSize(24)
    .drawText(60, 310, `${bpm} bpm`)
    .drawText(60, 340, key)
    .drawText(60, 370, 'prod. barlitxs')
    .fill('white')
    .fontSize(36)
    .drawText(60, 100, beatName)
    .fontSize(24)
    .drawText(60, 140, `${bpm} bpm`)
    .drawText(60, 170, key)
    .drawText(60, 200, 'prod. barlitxs')
    .gravity('South')
    .colorize(red, green, blue)
    .write(`${folderPath}/cropped.jpg`, function (err) {
      if (err) return console.dir(arguments);
      console.log('Cropped image for cover art');
      return gm(`${folderPath}/cropped.jpg`)
        .composite('/Users/carlitoswillis/Documents/brand graphics/cmd logo/barlogocover.png')
        .write(`${outputPath}/${name} cover.jpg`, (err) => {
          if (err) throw err;
          console.log('Finished cover art');
          callback(null);
        });
    });
}

function composeFullScreenArt({
  imagePath, folderPath, dimensions, beatName, bpm, key, colorsnumber, red, green, blue,
}, callback) {
  gm(imagePath)
    .gravity('North')
    .resize(dimensions.width <= dimensions.height
      ? 1920
      : null, dimensions.height <= dimensions.width
      ? 1080
      : null)
    .crop(1920, 1080)
    .fontSize(36)
    .fill('black')
    .gravity('NorthEast')
    .noise('poisson')
    .drawText(60, 270, beatName)
    .fontSize(24)
    .drawText(60, 310, `${bpm} bpm`)
    .drawText(60, 340, key)
    .drawText(60, 370, 'prod. barlitxs')
    .fill('white')
    .fontSize(36)
    .drawText(60, 100, beatName)
    .fontSize(24)
    .drawText(60, 140, `${bpm} bpm`)
    .drawText(60, 170, key)
    .drawText(60, 200, 'prod. barlitxs')
    .colors(colorsnumber)
    .gravity('South')
    .colorize(red, green, blue)
    .background('black')
    .extent(1920, 1080)
    .write(`${folderPath}/fullscreen.jpg`, function (err) {
      if (err) return console.dir(arguments);
      console.log('finished fullscreen image for video');
      return gm(`${folderPath}/fullscreen.jpg`)
        .composite('/Users/carlitoswillis/Documents/brand graphics/whitebarlogoFS.png')
        .write(`${folderPath}/fullscreen.jpg`, function (err) {
          if (err) return console.dir(arguments);
          console.log('Added logo to fullscreen');
          callback(null);
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
    .write(`${folderPath}/bordered.jpg`, function (err) {
      if (err) return console.dir(arguments);
      console.log('cropped for thumbnail and added border');
      return gm('/Users/carlitoswillis/Documents/graphic sources/typebeat.png')
        .gravity('North')
        .background(`rgb(${colorsArr})`)
        .extent(1080, 1080)
        .gravity('South')
        .font('/Users/carlitoswillis/Downloads/bebas_neue/BebasNeue-Regular.ttf')
        .fontSize(measure(type))
        .fill(`rgb(${[...colorsArr].map((x) => x * 0.85)})`)
        .stroke(`rgb(${[...colorsArr].map((x) => x * 0.85)})`, 10)
        .drawText(0, measure('Type Beat') * 1, type)
        .fill('white')
        .stroke('none')
        .drawText(-3, measure('Type Beat') * 1.03, type)
        .write(`${folderPath}/text.jpg`, (err) => {
          if (err) return console.dir(arguments);
          console.log('created text image for thumbnail');
          return gm(`${folderPath}/text.jpg`)
            .append(`${folderPath}/bordered.jpg`, true)
            .noise('laplacian')
            .write(`${folderPath}/thumb.jpg`, function (err) {
              if (err) return console.dir(arguments);
              console.log('finished thumbnail');
              callback(null);
            });
        });
    });
}

module.exports = (info, callback) => {
  const {
    name, imagePath, folderPath, type, outputPath, beatName, bpm, key,
  } = info;
  const measure = (str) => (2.2639 * 1080) / (str.length + 5);
  const [red, green, blue] = [randomcolor(), randomcolor(), randomcolor()];
  const colorsnumber = getRndInteger(3, 20);
  const colorsArr = colors();
  console.log(imagePath)
  const dimensions = sizeOf(imagePath);
  composeThumbnail({
    folderPath, imagePath, measure, type, colorsnumber, red, green, blue, colorsArr,
  }, () => {
    composeFullScreenArt({
      imagePath, folderPath, dimensions, beatName, bpm, key, colorsnumber, red, green, blue,
    }, () => {
      composeCoverArt({
        folderPath, imagePath, dimensions, colorsnumber, beatName, bpm, key, red, green, blue, outputPath, name,
      }, () => {
        callback(null);
      });
    });
  });
};
