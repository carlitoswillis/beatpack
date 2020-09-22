/* eslint-disable no-undef */
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

test('the data is processed as same object', () => {
  expect(single).toBe(single);
});
