const fs = require('fs');
const sanitize = require('../process/sanitize');
const cleanUp = require('../process/cleanUp');
const { makeFixture } = require('./helpers/fixture');

let fixture;
let single;

beforeEach(() => {
  fixture = makeFixture();
  single = sanitize({ ...fixture.info, delete: true, cleanUp: true });
});

afterEach(() => fixture.cleanup());

describe('clean intermediate files out of the track folder', () => {
  test('removes everything except .mp3 and .wav', (done) => {
    // seed the folder the way the pipeline leaves it: keepers plus debris
    fs.writeFileSync(`${single.folderPath}/${single.name}.mp3`, 'mp3');
    fs.writeFileSync(`${single.folderPath}/${single.name} cover3.png`, 'png');
    fs.writeFileSync(`${single.folderPath}/${single.name}-chopped.m4v`, 'm4v');
    fs.writeFileSync(`${single.folderPath}/fullscreen-blank.jpg`, 'jpg');

    cleanUp(single, (err) => {
      try {
        expect(err).toBeNull();
        const left = fs.readdirSync(single.folderPath).sort();
        expect(left).toEqual([`${single.name}.mp3`, `${single.name}.wav`].sort());
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
