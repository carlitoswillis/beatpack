/* eslint-disable import/no-dynamic-require */
const path = require('path');
const makeCover = require('../process/makeCover');
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
  single.upload = false;
  single = sanitize(single);
});

describe('take image/s and create graphics for content', () => {
  xtest('the data is processed', (done) => {
    function callback() {
      try {
        console.log('made it!');
        done();
      } catch (error) {
        done(error);
      }
    }

    makeCover(bulk, callback);
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
    makeCover(single, callback);
  });
});
