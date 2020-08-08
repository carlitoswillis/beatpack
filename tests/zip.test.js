const sanitize = require('../server/process/sanitize');
const zip = require('../server/process/zipfolder');
const testInfo = require('./testInfo');

let single;
let bulk;

beforeEach(() => {
  single = sanitize(testInfo());
  bulk = sanitize(testInfo(true));
});

describe('collect wav files and zip them together', () => {
  test('the data is processed', (done) => {
    function callback() {
      try {
        console.log('made it!');
        done();
      } catch (error) {
        done(error);
      }
    }

    zip(bulk, callback);
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
    zip(single, callback);
  });
});
