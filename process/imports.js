/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const util = require('util');
const path = require('path');

const {
  mp3, zip, video, upload, cleanUp,
} = require(path.resolve(__dirname, 'operations'));

const sanitize = require(path.resolve(__dirname, 'sanitize'));
const asyncMap = require(path.resolve(__dirname, 'asyncMapMax'));

module.exports = {
  fs,
  sanitize,
  mp3,
  zip,
  cleanUp,
  video,
  util,
  asyncMap,
  upload,
};
