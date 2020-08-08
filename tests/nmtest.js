const sanitize = require('../server/process/sanitize');
const testInfo = require('./testInfo');

const single = sanitize(testInfo());
const bulk = sanitize(testInfo(true));

console.log(single, bulk);

// test('the data is processed as same object', () => {
//   expect(single).not.toBe(bulk);
// });
// test('the data is processed as same object', () => {
//   expect(sanitize(single)).toBe(single);
// });
// test('the data is processed as same object', () => {
//   expect(sanitize(bulk)).toBe(single);
// });

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
