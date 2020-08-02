const fs = require('fs');
const Lame = require('node-lame').Lame;

module.exports = (info, callback) => {
  const { name, folderPath } = info;
  const mp3Path = `${folderPath}/${name}.mp3`;
  console.log(mp3Path);
  const storagePath = `/Users/carlitoswillis/Google Drive (carlitoswillis@berkeley.edu)/Track Outs/processed/${name}.mp3`

  const encoder = new Lame({
    output: mp3Path,
    bitrate: 320
  }).setFile(`${folderPath}/stems/${name}.wav`);

  encoder
    .encode()
      .then(() => {
        fs.copyFile(mp3Path, storagePath, (err) => {
          if (err) {
            callback(err)
          } else {}
          callback(null);
        })
      })
      .catch(error => {
        console.error('something went wrong!', error)
    })
}
