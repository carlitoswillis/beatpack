const fs = require('fs');
const path = require('path');
const Lame = require("node-lame").Lame;
const archiver = require('archiver');
const events = require('events');
var FfmpegCommand = require('fluent-ffmpeg');
var command = new FfmpegCommand();


const emitter = new events.EventEmitter();

module.exports = {
  fs, path, Lame, archiver, emitter, command
}