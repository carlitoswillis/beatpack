/* eslint-disable no-undef */
const sanitize = require('../server/process/sanitize');
const ffmpeg = require('../server/process/ffmpeg');
const testInfo = require('./testInfo');

let single;
let bulk;

jest.setTimeout.Timeout = 100000000;

beforeEach(() => {
  single = sanitize(testInfo());
  bulk = sanitize(testInfo(true));
});

describe('take fullscreen image and mp3 file to create video', () => {
  test('the data is processed', (done) => {
    jest.setTimeout(10 ** 5);
    function callback() {
      try {
        console.log('made it!');
        done();
      } catch (error) {
        done(error);
      }
    }

    ffmpeg(bulk, callback);
  });
  test('the data is processed', (done) => {
    jest.setTimeout(10 ** 5);
    function callback() {
      try {
        console.log('made it!');
        done();
      } catch (error) {
        done(error);
      }
    }
    ffmpeg(single, callback);
  });
});
