const fs = require('fs');
const archiver = require('archiver');

module.exports = (info, callback) => {
  const { folderPath, name } = info;
  fs.readdir(`${folderPath}/stems`, (err, files) => {
    const output = fs.createWriteStream(`/Users/carlitoswillis/Google Drive (carlitoswillis@berkeley.edu)/Track Outs/processed/${name}.zip`);
    const archive = archiver('zip');
    output.on('close', function () {
      callback(null, archive.pointer() + ' total bytes');
    });
    archive.on('error', function(err){
      callback(err);
    });
    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
}