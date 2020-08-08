const sanitize = require('../server/process/sanitize');
const testInfo = require('./testInfo');

let single;
let bulk;

beforeEach(() => {
  single = sanitize(testInfo());
  bulk = sanitize(testInfo(true));
});

test('the data is processed as same object', () => {
  expect(single).not.toBe(bulk);
});
test('the data is processed as same object', () => {
  expect(single).toBe(single);
});
test('the data is processed as same object', () => {
  expect(bulk).not.toBe(single);
});

// sanitize(bulk);
// describe('process input data for further use', () => {
//   test('the data is processed as same object', () => {
//     expect(sanitize(single)).toBe(single);
//   });
//   test('the data is processed as same object', () => {
//     const info2 = { ...single };
//     single.nextBeat();
//     expect(info2.folderPath).not.toEqual(single.folderPath);
//   });
// });
