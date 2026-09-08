const fs = require('fs');
const sanitize = require('../process/sanitize');
const encode = require('../process/encode');
const { makeFixture } = require('./helpers/fixture');

let fixture;
let single;

beforeEach(() => {
  fixture = makeFixture();
  single = sanitize({ ...fixture.info });
});

afterEach(() => fixture.cleanup());

describe('convert wav file to mp3 -> to output folder', () => {
  test('produces an mp3 in the output folder and beside the source', (done) => {
    encode(single, (err) => {
      try {
        expect(err).toBeFalsy();
        // encode() writes the mp3 to outputPath and then copies it back
        // next to the source wav; assert both, since the copy step had no
        // coverage at all before.
        expect(fs.existsSync(`${single.outputPath}/${single.name}.mp3`)).toBe(true);
        expect(fs.existsSync(`${single.folderPath}/${single.name}.mp3`)).toBe(true);
        expect(fs.statSync(`${single.outputPath}/${single.name}.mp3`).size).toBeGreaterThan(0);
        // it also copies the wav across
        expect(fs.existsSync(`${single.outputPath}/${single.name}.wav`)).toBe(true);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
