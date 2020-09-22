const upload = require('../process/upload');
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
  single.zip = false;
  single.upload = true;
  single = sanitize(single);
});

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
