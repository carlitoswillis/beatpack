const fs = require('fs');
const archiver = require('archiver');

module.exports = (info, callback) => {
  const { folderPath, name } = info;
  const path = `/Users/carlitoswillis/Google Drive (carlitoswillis@berkeley.edu)/Track Outs/processed/${name}`;
  fs.readdir(`${folderPath}/stems`, (err, files) => {
    const output = fs.createWriteStream(`${path}.zip`);
    const archive = archiver('zip');
    output.on('close', () => {
      callback(null, `${archive.pointer()} total bytes`);
    });
    archive.on('error', (err) => {
      callback(err);
    });
    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
};
