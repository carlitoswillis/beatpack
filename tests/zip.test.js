const zip = require('../process/zipfolder');
const sanitize = require('../process/sanitize');
const testInfo = require('../settings/info');

const event = { sender: { send: () => {} } };

let single;

beforeEach(() => {
  const { projects } = testInfo.files;
  const beat = projects.pop();
  single = { ...testInfo, ...beat, event };
  single.mp4 = false;
  single.cleanUp = false;
  single.delete = false;
  single.art = false;
  single.delete = false;
  single.mp3 = false;
  single.zip = true;
  single = sanitize(single);
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
    zip(single, callback);
  });
});
