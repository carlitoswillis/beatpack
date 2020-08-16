/* eslint-disable no-undef */
const ffmpeg = require('../process/ffmpeg');
const sanitize = require('../process/sanitize');
const testInfo = require('../settings/info');

let info = { ...testInfo, ...testInfo.files.projects[0] };

let single;
let bulk;

jest.setTimeout.Timeout = 100000000;

beforeEach(() => {
  single = sanitize(info);
  // bulk = sanitize(testInfo(true));
});

describe('take fullscreen image and mp3 file to create video', () => {
  xtest('the data is processed', (done) => {
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
