/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-param-reassign */
const path = require('path');
const fs = require('fs');

const {
  mp3, zip, art, mp4, upload, cleanUp,
} = require(path.resolve(__dirname, 'sanitizeImports'));

const ops = {
  mp3, zip, art, mp4, upload, cleanUp,
};

const sanitize = (info) => {
  if (!info.event) {
    info.event = { sender: { send: () => {} } };
  }
  info.folderPath = info.trackPath;
  try {
    fs.lstatSync(info.outputPath).isDirectory();
  } catch (e) {
    try {
      fs.lstatSync(path.resolve(process.env.HOME, 'Downloads', 'beatpack')).isDirectory();
    } catch (f) {
      fs.mkdirSync(path.resolve(process.env.HOME, 'Downloads', 'beatpack'));
    }
    info.outputPath = path.resolve(process.env.HOME, 'Downloads', 'beatpack');
  }
  info.logoPath = path.resolve(__dirname, '..', 'public', 'logo.png');
  info.fullscreenLogoPath = path.resolve(__dirname, '..', 'public', 'fullscreen.png');
  info.imagePath = info.files.images[Math.floor(Math.random() * Math.floor(info.files.images.length))];
  info.vidPath = info.files.videos[Math.floor(Math.random() * Math.floor(info.files.videos.length))];
  info.tasks = ['mp3', 'zip', 'art', 'mp4', 'upload', 'cleanUp']
    .filter((x) => Object.keys(info)
      .includes(x) && info[x])
    .map((x) => [x, ops[x]]);
  info.tags = info.tags.split(', ').join(',').split(',');
  info.dates = new Array(7)
    .fill(new Date(info.startDate || new Date()))
    .map((date) => {
      date.setHours(info.startTime
        .split(':')[0],
      info.startTime
        .split(':')[1], 0, 0);
      date.setDate(date.getDate() + 1);
      const time = date.toISOString();
      return time;
    });
  info.name = info.file;
  info.videoPath = `${info.folderPath}/${info.name}.mp4`;
  info.date = info.dates.shift();
  info.title = `${info.title} ${info.beatName}`;
  const titleArr = info.title.split('');
  while (titleArr.length > 100) {
    titleArr.pop();
    info.title = titleArr.join('');
  }
  info.searchKeyword = `${info.beatName.split(' ').join('%20')}%20${info.type.split(' ').join('%20')}`;
  info.vidDescription = `${info.title} available for download\nFree Download or Purchase: https://player.beatstars.com/?storeId=71006&search_keyword=${info.searchKeyword}\n\nig: http://instagram.com/barlitxs\ntwitter: http://twitter.com/barlitxs\nsoundcloud: http://soundcloud.com/barlitxs\n\n${info.title}\nprod. barlitxs\n\n${info.description || ''}\n\n${info.tags}`;
  return info;
};

module.exports = sanitize;
