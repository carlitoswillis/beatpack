const fs = require('fs');
const sanitize = require('../process/sanitize');
const makeCover = require('../process/makeCover');
const { makeFixture } = require('./helpers/fixture');

let fixture;
let single;

beforeEach(() => {
  fixture = makeFixture();
  single = sanitize({ ...fixture.info, art: true });
});

afterEach(() => fixture.cleanup());

describe('take image/s and create graphics for content', () => {
  test('renders the cover art set with GraphicsMagick', (done) => {
    // gm shells out to the GraphicsMagick binary and renders live TTF text
    // at several sizes; on a cold cache this is not instant.
    jest.setTimeout(60000);
    makeCover(single, (err) => {
      try {
        expect(err).toBeNull();
        const produced = fs.readdirSync(single.folderPath);
        // The exact filename set is generated from the beat name, so assert
        // on the shapes the downstream ffmpeg stages actually consume
        // rather than on a brittle literal list.
        expect(produced).toContain(`${single.name} cover3.png`);
        expect(produced.some((f) => f.startsWith('fullscreen-cover'))).toBe(true);
        produced
          .filter((f) => f.endsWith('.png') || f.endsWith('.jpg'))
          .forEach((f) => {
            expect(fs.statSync(`${single.folderPath}/${f}`).size).toBeGreaterThan(0);
          });
        done();
      } catch (error) {
        done(error);
      }
    });
  }, 60000);
});
