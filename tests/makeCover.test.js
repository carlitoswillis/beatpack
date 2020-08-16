/* eslint-disable import/no-dynamic-require */
const path = require('path');

const sanitize = require('../process/sanitize');
const makeCover = require('../process/makeCover');
const testInfo = require('../settings/info');
let info = { ...testInfo, ...testInfo.files.projects[0] };

let single;
let bulk;

beforeEach(() => {
  single = sanitize(info);
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
