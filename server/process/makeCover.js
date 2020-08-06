/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-shadow */
/* eslint-disable prefer-rest-params */
// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)
const gm = require('gm');
const fs = require('fs');
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
    const b = () => [0, getRndInteger(175, 255)][getRndInteger(0, 1)];
    return [r(), g(), b()];
  };
  return Date.now() % 2 === 0 ? v1() : v2();
}

const makeCover = (data, callback) => {
  const {
    name, input, output, type,
  } = data;
  const namestuff = name.split(' (prod. barlitxs) ');
  const bpmAndKey = namestuff[1].split('bpm ');
  const bpm = bpmAndKey[0];
  const key = bpmAndKey[1];
  const measure = (str) => (2.2639 * 1080) / (str.length + 5);
  const [red, green, blue] = [randomcolor(), randomcolor(), randomcolor()];
  const colorsnumber = getRndInteger(3, 20);
  const colorsArr = colors();
  const dimensions = sizeOf(`${input}`);
  gm(`${input}`)
    .resize(null, 1080)
    .crop(1920, 1080, 0, 0)
    .fontSize(36)
    .fill('black')
    .gravity('NorthEast')
    .noise('poisson')
    .drawText(60, 270, `${namestuff[0]}`)
    .fontSize(24)
    .drawText(60, 310, `${bpm} bpm`)
    .drawText(60, 340, `${key}`)
    .drawText(60, 370, 'prod. barlitxs')
    .fill('white')
    .fontSize(36)
    .drawText(60, 100, `${namestuff[0]}`)
    .fontSize(24)
    .drawText(60, 140, `${bpm} bpm`)
    .drawText(60, 170, `${key}`)
    .drawText(60, 200, 'prod. barlitxs')
    .colors(colorsnumber)
    .gravity('South')
    .colorize(red, green, blue)
    .write(`${output}/main.jpg`, function (err) {
      if (err) return console.dir(arguments);
      console.log('cropped and wrote on image');
      return gm(`${input}`)
        .gravity('North')
        .resize(null, 1080)
        .crop(800, 1040, 0, 0)
        .gravity('Center')
        .colors(colorsnumber)
        .colorize(red, green, blue)
        .noise('laplacian')
        .borderColor(`rgb(${colorsArr})`)
        .border(20, 20)
        .write(`${output}/cropped.jpg`, function (err) {
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
            .drawText(0, measure('Type Beat') * 1.1, type)
            .fill('white')
            .stroke('none')
            .drawText(-5, measure('Type Beat') * 1, type)
            // .gravity('North')
            // .fontSize(407)
            // .drawText(0, 366, 'FREE')
            // .fontSize(180)
            // .drawText(0, 529, 'DOWNLOAD')
            // .fontSize(measure('Type Beat'))
            // .drawText(0, 67, 'Type Beat')
            .write(`${output}/text.jpg`, (err) => {
              if (err) return console.dir(arguments);
              console.log('created text image for thumbnail');
              return gm(`${output}/text.jpg`)
                .append(`${output}/cropped.jpg`, true)
                .noise('laplacian')
                .write(`${output}/thumb.jpg`, function (err) {
                  if (err) return console.dir(arguments);
                  console.log('finished thumbnail');
                  return gm(`${output}/main.jpg`)
                    .gravity('North')
                    .resize(dimensions.width <= dimensions.height
                      ? 1920
                      : null, dimensions.height <= dimensions.width
                      ? 1080
                      : null)
                    .crop(1920, 1080)
                    .background('black')
                    .extent(1920, 1080)
                    .write(`${output}/fullscreen.jpg`, function (err) {
                      if (err) return console.dir(arguments);
                      console.log('finished fullscreen image for video');
                      // gm.source = `${output}/fullscreen.jpg`;
                      return gm(`${input}`)
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
                        .drawText(60, 270, `${namestuff[0]}`)
                        .fontSize(24)
                        .drawText(60, 310, `${bpm} bpm`)
                        .drawText(60, 340, `${key}`)
                        .drawText(60, 370, 'prod. barlitxs')
                        .fill('white')
                        .fontSize(36)
                        .drawText(60, 100, `${namestuff[0]}`)
                        .fontSize(24)
                        .drawText(60, 140, `${bpm} bpm`)
                        .drawText(60, 170, `${key}`)
                        .drawText(60, 200, 'prod. barlitxs')
                        .gravity('South')
                        .colorize(red, green, blue)
                        .write(`${output}/cropped2.jpg`, function (err) {
                          if (err) return console.dir(arguments);
                          console.log('Cropped for cover art');
                          return gm(`${output}/cropped2.jpg`)
                            .composite('/Users/carlitoswillis/Documents/brand graphics/cmd logo/barlogocover.png')
                            .write(`/Users/carlitoswillis/Google Drive (carlitoswillis@berkeley.edu)/Track Outs/processed/${name} cover.jpg`, (err) => {
                              if (err) throw err;
                              console.log('Made cover art');
                              fs.unlink(`${output}/text.jpg`, () => {
                                fs.unlink(`${output}/main.jpg`, () => {
                                  fs.unlink(`${output}/cropped.jpg`, () => {
                                    fs.unlink(`${output}/cropped2.jpg`, () => callback(null));
                                  });
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

module.exports = makeCover;
