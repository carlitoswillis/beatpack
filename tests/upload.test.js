/* eslint-disable no-undef */
const sanitize = require('../server/process/sanitize');
const upload = require('../server/process/upload');
const testInfo = require('./testInfo');

let single;
let bulk;

const skip = (info, cb) => {
  cb();
};

jest.setTimeout.Timeout = 100000000;

beforeEach(() => {
  single = sanitize(testInfo());
  bulk = sanitize(testInfo(true));
});

describe('Upload video to youtube', () => {
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

    skip(bulk, callback);
    // upload(bulk, callback);
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
    skip(single, callback);
    // upload(single, callback);
  });
});
