const fs = require('fs');
const sanitize = require('../process/sanitize');
const upload = require('../process/upload');
const { makeFixture } = require('./helpers/fixture');

let fixture;
let single;

beforeEach(() => {
  fixture = makeFixture();
  single = sanitize({ ...fixture.info, upload: true });
});

afterEach(() => fixture.cleanup());

describe('write track info for upload', () => {
  test('writes a trackinfo.csv with a header row and the track', (done) => {
    upload(single, (err) => {
      try {
        expect(err).toBeNull();
        const csvPath = `${single.outputPath}/trackinfo.csv`;
        // csv-write-stream finishes asynchronously through the file stream
        setTimeout(() => {
          try {
            expect(fs.existsSync(csvPath)).toBe(true);
            const csv = fs.readFileSync(csvPath, 'utf8');
            expect(csv.split('\n')[0]).toBe('track,title,date,description,tags,privacyStatus');
            expect(csv).toContain(single.name);
            expect(csv).toContain('private');
            done();
          } catch (error) {
            done(error);
          }
        }, 250);
      } catch (error) {
        done(error);
      }
    });
  });

  test('appends without repeating the header on a second write', (done) => {
    upload(single, () => {
      setTimeout(() => {
        upload(single, () => {
          setTimeout(() => {
            try {
              const csv = fs.readFileSync(`${single.outputPath}/trackinfo.csv`, 'utf8');
              const headerCount = csv
                .split('\n')
                .filter((line) => line.startsWith('track,title,date')).length;
              expect(headerCount).toBe(1);
              done();
            } catch (error) {
              done(error);
            }
          }, 250);
        });
      }, 250);
    });
  });
});
