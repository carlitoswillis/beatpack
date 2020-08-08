/* eslint-disable no-shadow */
/* eslint-disable no-console */
const fs = require('fs');
const { google } = require('googleapis');

const { oAuth2Client } = require('../youtube/auth');
const { tokens } = require('../youtube/tokens');

oAuth2Client.setCredentials(tokens);

const uploader = (info, callback) => {
  const {
    folderPath, tags, date, title, videoPath,
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
      youtube.thumbnails.set(
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
      );
    },
  );
};

module.exports = uploader;
