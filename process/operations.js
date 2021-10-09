/* eslint-disable import/no-dynamic-require */
const path = require('path');

const mp3 = require(path.resolve(__dirname, 'encode'));
const zip = require(path.resolve(__dirname, 'zipfolder'));
const cleanUp = require(path.resolve(__dirname, 'cleanUp'));
const art = require(path.resolve(__dirname, 'makeCover'));
const video = require(path.resolve(__dirname, 'ffmpeg'));
const upload = require(path.resolve(__dirname, 'upload'));

module.exports = {
  mp3, zip, art, video, upload, cleanUp,
};
