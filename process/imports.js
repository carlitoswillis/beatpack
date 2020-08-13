/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const util = require('util');
const path = require('path');

const sanitize = require(path.resolve(__dirname, 'sanitize'));
const asyncMap = require(path.resolve(__dirname, 'asyncMapMax'));
const mp3 = require(path.resolve(__dirname, 'encode'));
const zip = require(path.resolve(__dirname, 'zipfolder'));
const mp4 = require(path.resolve(__dirname, 'ffmpeg'));
const upload = require(path.resolve(__dirname, 'upload'));

module.exports = {
  fs, sanitize, mp3, zip, mp4, util, asyncMap, upload,
};
