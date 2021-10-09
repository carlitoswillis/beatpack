/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-shadow */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-write-stream');
const cp = require('child_process');

const { google } = require('googleapis');

const { oAuth2Client } = require(path.resolve(__dirname, '..', 'youtube', 'auth'));
const { tokens } = require(path.resolve(__dirname, '..', 'youtube', 'tokens'));
if (tokens.expiry_date < Date.now()) {
  cp.exec('open -a "Google Chrome" http://localhost:5000/login', (err) => {
    if (err) console.error(err);
  });
} else {
  console.log('youtube tokens good');
}
oAuth2Client.setCredentials(tokens);

const uploader = (info, callback) => {
  const {
    folderPath, tags, date, title, videoPath, outputPath,
  } = info;
  const description = info.vidDescription;
  const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
  youtube.videos.insert(
    {
      resource: {
        snippet: {
          title,
          description,
          tags,
        },
        status: {
          privacyStatus: 'private',
          publishAt: date,
          madeForKids: false,
        },
      },
      // This is for the callback function
      part: 'snippet,status',

      // Create the readable stream to upload the video
      media: {
        body: fs.createReadStream(videoPath),
      },
    },
    (err, data) => {
      if (err) throw err;
      console.log('Video uploaded');
      let writer;
      if (!fs.existsSync(`${outputPath}/trackinfo.csv`)) {
        writer = csvWriter({ headers: ['track', 'date'] });
      } else {
        writer = csvWriter({ sendHeaders: false });
      }
      writer.pipe(fs.createWriteStream(`${outputPath}/trackinfo.csv`, { flags: 'a' }));
      writer.write({
        track: info.name,
        date,
      });
      writer.end();
      callback(null);
      /* youtube.thumbnails.set(
        {
          videoId: data.data.id,
          media: {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(`${folderPath}/thumb.jpg`),
          },
        },
        (err) => {
          if (err) {
            console.log('Error response');
            console.log(err);
            throw err;
          }
          console.log('Thumbnail uploaded');
          callback(null);
        },
      ); */
    },
  );
};

module.exports = uploader;
