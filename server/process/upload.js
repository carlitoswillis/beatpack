/* eslint-disable no-shadow */
/* eslint-disable no-console */
const fs = require('fs');
const { google } = require('googleapis');

const { oAuth2Client } = require('../youtube/auth');
const { tokens } = require('../youtube/tokens');

oAuth2Client.setCredentials(tokens);

const uploader = (info, callback) => {
  const {
    folderPath, name, tags, dates, title,
  } = info;
  const date = dates.shift();
  const videoPath = `${folderPath}/${name}.mp4`;
  const description = `${title} availavle for download\nFree download: https://bsta.rs/\nPurchase: https://www.beatstars.com/barlitxs\n\nig: http://instagram.com/barlitxs\ntwitter: http://twitter.com/barlitxs\nsoundcloud: http://soundcloud.com/barlitxs\n\n${title}\nprod. barlitxs\n\n\n\n${tags}`;
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
      console.log(data);
      console.log('video uploaded');
      youtube.thumbnails.set(
        {
          videoId: data.data.id,
          media: {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(`${folderPath}/thumb.jpg`),
          },
        },
        (err, thumbResponse) => {
          if (err) {
            console.log('Error response');
            console.log(err);
            throw err;
          }
          console.log('thumbnail uploaded');
          console.log(thumbResponse);
          callback(null, thumbResponse);
        },
      );
    },
  );
};

module.exports = uploader;
