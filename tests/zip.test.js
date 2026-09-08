const fs = require('fs');
const { execFileSync } = require('child_process');
const sanitize = require('../process/sanitize');
const zip = require('../process/zipfolder');
const { makeFixture } = require('./helpers/fixture');

let fixture;
let single;

beforeEach(() => {
  fixture = makeFixture();
  single = sanitize({ ...fixture.info, zip: true });
});

afterEach(() => fixture.cleanup());

describe('collect wav files and zip them together', () => {
  test('writes a zip that actually opens and contains the stems', (done) => {
    // add a second file so the archive has real structure
    fs.writeFileSync(`${single.folderPath}/notes.txt`, 'stem notes');

    zip(single, (err, summary) => {
      try {
        expect(err).toBeNull();
        expect(summary).toMatch(/total bytes/);

        const zipPath = `${single.outputPath}/${single.name}.zip`;
        expect(fs.existsSync(zipPath)).toBe(true);
        expect(fs.statSync(zipPath).size).toBeGreaterThan(0);

        // Actually open it. A zip that is written but unreadable is the
        // failure mode a "the callback fired" assertion cannot catch.
        const listing = execFileSync('unzip', ['-l', zipPath]).toString();
        expect(listing).toContain(`${single.name}.wav`);
        expect(listing).toContain('notes.txt');

        // and verify the archive's internal checksums
        execFileSync('unzip', ['-t', zipPath]);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
