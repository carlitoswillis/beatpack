const fs = require('fs');
const archiver = require('archiver');

module.exports = (info, callback) => {
  const { folderPath, name, outputPath } = info;
  let stemPath = `${folderPath}`;
  fs.readdir(`${stemPath}`, (err, files) => {
    if (err) console.log(err);
    const output = fs.createWriteStream(`${outputPath}/${name}.zip`);
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
