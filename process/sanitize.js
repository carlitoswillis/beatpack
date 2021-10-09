/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-param-reassign */
const path = require('path');
const fs = require('fs');

const { floor, random } = Math;

const {
  mp3, zip, art, video, upload, cleanUp,
} = require(path.resolve(__dirname, 'operations'));

const ops = {
  mp3, zip, art, video, upload, cleanUp,
};

const initVideoFolders = (outputPath) => {
  if (!fs.existsSync(`${outputPath}/youtubevideos/`)) fs.mkdirSync(`${outputPath}/youtubevideos/`);
  if (!fs.existsSync(`${outputPath}/igvideos/`)) fs.mkdirSync(`${outputPath}/igvideos/`);
  if (!fs.existsSync(`${outputPath}/igvideoswithlogo/`)) fs.mkdirSync(`${outputPath}/igvideoswithlogo/`);
};

const sanitize = (info, callback = () => {}) => {
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
  try {
    fs.lstatSync(info.logoPath).isFile();
  } catch (e) {
    info.logoPath = path.resolve(__dirname, '..', 'public', 'logo.png');
  }
  try {
    fs.lstatSync(info.fullscreenLogoPath).isFile();
  } catch (e) {
    info.fullscreenLogoPath = path.resolve(__dirname, '..', 'public', 'fullscreen-logo-default.png');
  }
  info.logoPath = !info.logoPath.includes('.png') ? path.resolve(__dirname, '..', 'public', 'logo.png') : info.logoPath;
  info.logoPath_default = path.resolve(__dirname, '..', 'public', 'logo.png');
  info.fullscreenLogoPath = !info.fullscreenLogoPath.includes('.png') ? path.resolve(__dirname, '..', 'public', 'fullscreen.png') : info.fullscreenLogoPath;
  info.fullscreenLogoPath_default = path.resolve(__dirname, '..', 'public', 'fullscreen-logo-default.png');
  info.imagePath = info.files.images[floor(random() * floor(info.files.images.length))];
  info.vidPath = info.files.videos[floor(random() * floor(info.files.videos.length))];
  info.tasks = Object.keys(ops)
    .filter((x) => Object.keys(info)
      .includes(x) && info[x])
    .map((x) => [x, ops[x]]);
  info.tags = info.tags.split(', ').join(',').split(',');
  info.name = info.file;
  info.videoPath = `${info.folderPath}/${info.name}.mp4`;
  info.beatName = info.beatName || 'untitled';
  info.bpm = info.bpm || '';
  info.key = info.key || '';
  info.producer = info.producer || '';
  info.title = `${info.title} - ${info.beatName}${info.producer ? ` (${info.producer})` : ''}`;
  const titleArr = info.title.split('');
  while (titleArr.length > 100) {
    titleArr.pop();
  }
  info.title = titleArr.join('');
  info.searchKeyword = `${info.beatName.split(' ').join('%20')}%20${info.type.split(' ').join('%20')}`;
  info.vidDescription = `${info.title} available for instant download \nFree Trial Download or Purchase: -InsertLinkHere-\n\nCurrent Deal - Buy 2 Beats get 1 Free\n\nig: http://instagram.com/barlitxs\ntwitter: http://twitter.com/barlitxs\nsoundcloud: http://soundcloud.com/barlitxs\n\n${info.title}\nprod. barlitxs\n\n${info.description || ''}\n\n`;
  initVideoFolders(info.outputPath);
  callback(null, info);
  return info;
};

module.exports = sanitize;
