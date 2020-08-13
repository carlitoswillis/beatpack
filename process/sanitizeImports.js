/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const path = require('path');

const mp3 = require(path.resolve(__dirname, 'encode'));
const zip = require(path.resolve(__dirname, 'zipfolder'));
const art = require(path.resolve(__dirname, 'makeCover'));
const cleanUp = require(path.resolve(__dirname, 'cleanUp'));
const mp4 = require(path.resolve(__dirname, 'ffmpeg'));
const upload = require(path.resolve(__dirname, 'upload'));

module.exports = {
  fs, mp3, zip, art, mp4, upload, cleanUp,
};
