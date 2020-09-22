/* eslint-disable no-undef */
const cleanUp = require('../process/cleanUp');
const sanitize = require('../process/sanitize');
const testInfo = require('../settings/info');

const event = { sender: { send: () => {} } };

let single;

beforeEach(() => {
  const { projects } = testInfo.files;
  const beat = projects.pop();
  single = { ...testInfo, ...beat, event };
  single.delete = true;
  single.cleanUp = true;
  single = sanitize(single);
});

jest.setTimeout.Timeout = 100000000;
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
    cleanUp(single, callback);
  });
});
