const { Lame, emitter, path } = require('./imports');

// maybe use this
// https://github.com/TooTallNate/node-lame/blob/master/examples/wav2mp3.js

module.exports = (np, name, singleMode) => {
  console.log(np)
  const encoder = new Lame({
    output: `${np}/${name}.mp3`,
    bitrate: 320
  }).setFile(`${np}/stems/${name}.wav`);

  encoder
    .encode()
    .then(() => {
      console.log('done converting to mp3!')
      emitter.emit('zip');
      // process.exit();
      })
      .catch(error => {
        // Something went wrong
        console.log('something went wrong!')
        console.error(error);
        // process.exit();
    });
}