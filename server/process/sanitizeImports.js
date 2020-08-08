const fs = require('fs');
const mp3 = require('./encode');
const zip = require('./zipfolder');
const makeCover = require('./makeCover');
const cleanUp = require('./cleanUp');
const mp4 = require('./ffmpeg');
const upload = require('./upload');

module.exports = {
  fs, mp3, zip, makeCover, mp4, upload, cleanUp,
};
