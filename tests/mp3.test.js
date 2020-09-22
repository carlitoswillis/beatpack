const sanitize = require('../process/sanitize');
const encode = require('../process/encode');
const testInfo = require('../settings/info');

const event = { sender: { send: () => {} } };
let single;

beforeEach(() => {
  const { projects } = testInfo.files;
  const beat = projects.pop();
  single = { ...testInfo, ...beat, event };
  single = sanitize(single);
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
    encode(single, callback);
  });
});
