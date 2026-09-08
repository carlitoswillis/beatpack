/**
 * Self-contained test fixtures.
 *
 * Before this existed, tests/cleanup, tests/mp3 and tests/makeCover read
 * settings/info.json, whose paths are the original author's personal
 * absolute paths under /Users/carlitoswillis/Downloads/... . On any other
 * checkout those tests failed with ENOENT, so the suite could only ever be
 * green on one machine.
 *
 * This builds a real, disposable project tree in the OS temp dir instead:
 * a genuine PCM .wav synthesised here (no ffmpeg needed, so the fixture
 * does not depend on the thing under test) and a real PNG copied from
 * public/, which is already committed. Nothing binary is added to the repo.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Write a valid 16-bit PCM RIFF/WAVE file: a quiet stereo sine.
 * Hand-built rather than generated with ffmpeg, so a broken ffmpeg cannot
 * make the fixture itself fail.
 */
const writeWav = (filePath, { seconds = 1, sampleRate = 44100 } = {}) => {
  const channels = 2;
  const bytesPerSample = 2;
  const frames = Math.floor(seconds * sampleRate);
  const dataBytes = frames * channels * bytesPerSample;
  const buf = Buffer.alloc(44 + dataBytes);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM fmt chunk size
  buf.writeUInt16LE(1, 20); // audio format: PCM
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * channels * bytesPerSample, 28); // byte rate
  buf.writeUInt16LE(channels * bytesPerSample, 32); // block align
  buf.writeUInt16LE(8 * bytesPerSample, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < frames; i += 1) {
    const sample = Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 8000);
    const offset = 44 + i * channels * bytesPerSample;
    buf.writeInt16LE(sample, offset);
    buf.writeInt16LE(sample, offset + bytesPerSample);
  }
  fs.writeFileSync(filePath, buf);
  return filePath;
};

/**
 * Build a disposable project tree and return an `info` object shaped the
 * way the renderer sends one (i.e. what process/sanitize.js expects).
 */
const makeFixture = ({ beatName = 'testbeat', seconds = 1 } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'beatpack-test-'));
  const trackPath = path.join(root, 'tracks', `${beatName} (prod. tester) 123 bpm C Major`);
  const outputPath = path.join(root, 'output');
  const file = `${beatName} (prod. tester) 123 bpm C Major`;

  fs.mkdirSync(trackPath, { recursive: true });
  fs.mkdirSync(outputPath, { recursive: true });

  writeWav(path.join(trackPath, `${file}.wav`), { seconds });

  // A real PNG, taken from a file already committed to this repo, so the
  // fixture needs no new binary asset and gm gets genuine image data.
  const image = path.join(root, 'cover.png');
  fs.copyFileSync(path.join(REPO_ROOT, 'public', 'logo.png'), image);

  const info = {
    single: true,
    type: 'test type',
    mp3: false,
    video: false,
    zip: false,
    upload: false,
    art: false,
    delete: false,
    cleanUp: false,
    outputPath,
    trackPath,
    file,
    beatName,
    bpm: '123',
    key: 'c major',
    producer: 'tester',
    files: { images: [image], projects: [], videos: [] },
    tags: 'tags, go, here',
    title: 'title goes here',
    description: 'test description',
    startDate: '2020-10-31',
    startTime: '9:29',
    trackInfo: {},
    logoPath: path.join(REPO_ROOT, 'public', 'logo.png'),
    fullscreenLogoPath: path.join(REPO_ROOT, 'public', 'fullscreen-logo-default.png'),
    event: { sender: { send: () => {} } },
  };

  return {
    root,
    info,
    trackPath,
    outputPath,
    file,
    image,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
};

module.exports = { makeFixture, writeWav };
