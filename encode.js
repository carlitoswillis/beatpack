const { Lame, emitter, path } = require('./imports');

module.exports = (np, name) => {
  const pat = path.join(np, 'stems', `${name}.wav`);
  console.log(typeof pat, pat);
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