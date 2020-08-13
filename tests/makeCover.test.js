/* eslint-disable import/no-dynamic-require */
const path = require('path');

const sanitize = require(path.resolve(__dirname, '..', 'server', 'process', 'sanitize'));
const makeCover = require('../server/process/makeCover');
const testInfo = require('./testInfo');

let single;
let bulk;

beforeEach(() => {
  single = sanitize(testInfo());
  bulk = sanitize(testInfo(true));
});

describe('take image/s and create graphics for content', () => {
  test('the data is processed', (done) => {
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
