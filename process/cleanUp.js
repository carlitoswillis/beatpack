/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// delete the temporary files from main folder
const cleanup = (info, callback) => {
  const { folderPath } = info;

  console.log('cleaning up!!!');

  fs.readdir(folderPath, (err, files) => {
    if (err) throw err;
    const otherFiles = files.filter((file) => !['.mp3', '.wav'].includes(file.slice(file.length - 4)));
    const filePaths = otherFiles.map((file) => `${folderPath}/${file}`);

    filePaths.forEach((filepath) => {
      try {
        fs.unlinkSync(filepath);
      } catch (e) {
        fs.writeFileSync(path.resolve(__dirname, '..', 'errorlogs', `${new Date().getTime().toString()}`), JSON.stringify({ location: 'cleanup', args: filepath, e }));
      }
    });

    callback(null);
  });
};

module.exports = cleanup;
