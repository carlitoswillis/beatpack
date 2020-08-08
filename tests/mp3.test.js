const sanitize = require('../server/process/sanitize');
const encode = require('../server/process/encode');
const testInfo = require('./testInfo');

let single;
let bulk;

beforeEach(() => {
  single = sanitize(testInfo());
  bulk = sanitize(testInfo(true));
});

describe('convert wav file to mp3 -> to output folder', () => {
  test('the data is processed', (done) => {
    function callback() {
      try {
        console.log('made it!');
        done();
      } catch (error) {
        done(error);
      }
    }

    encode(bulk, callback);
  });
  test('the data is processed', (done) => {
    function callback() {
      try {
        console.log('made it!');
        done();
      } catch (error) {
        done(error);
      }
    }
    encode(single, callback);
  });
});
