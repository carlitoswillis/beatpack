/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable no-shadow */
/* eslint-disable prefer-rest-params */
const gm = require('gm');
// gm - Copyright Aaron Heckmann <aaron.heckmann+github@gmail.com> (MIT Licensed)
function randomcolor() {
  return Math.floor(Math.random() * (10));
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const makeCover = (data, callback) => {
  const {
    name, input, output, type, bw,
  } = data;
  const namestuff = name.split(' (prod. barlitxs) ');
  const bpmAndKey = namestuff[1].split('bpm ');
  const bpm = bpmAndKey[0];
  const key = bpmAndKey[1];
  // const typebeat = `‎‎${type} type beat`;
  const typebeat = `${type} type beat`;
  const measure = (str) => (2.2639 * 1080) / (str.length + 4);
  const size = measure(typebeat);
  const [red, green, blue] = [randomcolor(), randomcolor(), randomcolor()];
  const colorsnumber = getRndInteger(3, 20);
  console.log(colorsnumber);
  gm(`${input}`)
    .fontSize(36)
    .fill(bw.textColor)
    .gravity('NorthEast')
    .drawText(60, 270, `${namestuff[0]}`)
    .fontSize(24)
    .drawText(60, 310, `${bpm} bpm`)
    .drawText(60, 340, `${key}`)
    .drawText(60, 370, 'prod. barlitxs')
    .fill(bw.color)
    .fontSize(36)
    .drawText(60, 100, `${namestuff[0]}`)
    .fontSize(24)
    .drawText(60, 140, `${bpm} bpm`)
    .drawText(60, 170, `${key}`)
    .drawText(60, 200, 'prod. barlitxs')
    .colors(colorsnumber)
    .gravity('South')
    .colorize(red, green, blue)
    .noise('poisson')
    .write(`${output}/main.jpg`, function (err) {
      if (err) return console.dir(arguments);
      console.log('modified image');
      return gm(`${input}`)
        .gravity('North')
        .resize(null, 1080)
        .crop(840, 1080, 0, 0)
        .gravity('Center')
        .colors(colorsnumber)
        .colorize(red, green, blue)
        .noise('laplacian')
        .write(`${output}/cropped.jpg`, function (err) {
          if (err) return console.dir(arguments);
          console.log('modified image');
          return gm('/Users/carlitoswillis/Documents/graphic sources/blank2.jpg')
            .crop(1080, 1080)
            .colors(colorsnumber)
            .fill('white')
            .drawRectangle(0, 0, 1080, 1080)
            .fill('black')
            .stroke('black', 9)
            .gravity('North')
            .fontSize(407)
            .drawText(0, 366, 'FREE')
            .fontSize(180)
            .drawText(0, 529, 'DOWNLOAD')
            .gravity('South')
            .fontSize(measure(type))
            .drawText(0, measure('Type Beat') * 1.45, type)
            .fontSize(measure('Type Beat'))
            .drawText(0, 67, 'Type Beat')
            .write(`${output}/text.jpg`, function (err) {
              if (err) return console.dir(arguments);
              gm(`${output}/text.jpg`)
                .append(`${output}/cropped.jpg`, true)
                .write(`${output}/thumb.jpg`, function (err) {
                  if (err) return console.dir(arguments);
                  console.log('made thumbnail');
                  return callback(null);
                });
            });
        });
    });
};

module.exports = makeCover;
