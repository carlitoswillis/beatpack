const fs = require('fs');
const mp3 = require('./encode');
const zip = require('./zipfolder');
const mp4 = require('./ffmpeg');
const upload = require('./upload');

module.exports = {
  fs, mp3, zip, mp4, upload,
};
