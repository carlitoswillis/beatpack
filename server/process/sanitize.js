/* eslint-disable no-param-reassign */
const fs = require('fs');

module.exports = (info) => {
  info.folderPath = info.folderPath.replace('\n', '').split(String.fromCharCode(92)).join('');
  info.imagePath = info.mp4 ? info.imagePath.replace('\n', '').split(String.fromCharCode(92)).join('') : '';
  info.tasks = Object.keys(info).filter((x) => ['mp4', 'mp3', 'zip'].includes(x) && info[x]);
  info.projects = [];
  info.images = [];

  if (info.single) {
    info.name = info.folderPath.split('/').pop();
  } else {
    const files = fs.readdirSync(info.folderPath);
    for (const f of files) {
      const fname = `${info.folderPath}/${f}`;
      if (fs.statSync(fname).isDirectory()) {
        info.projects.push(fname);
      }
    }
    info.folderPath = info.projects.pop();
    info.name = info.folderPath.split('/').pop();

    const images = fs.readdirSync(info.imagePath);
    for (const image of images) {
      const imagePath = `${info.imagePath}/${image}`;
      if (image[0] !== '.' && !fs.statSync(imagePath).isDirectory()) {
        info.images.push(imagePath);
      }
    }

    info.imagePath = info.images[Math.floor(Math.random() * info.images.length)];
  }
};
// const files = info.folderPath;
//     files.forEach((f) => {
//       if (fs.statSync(f.path).isDirectory()) {
//         info.projects.push(f.path);
//         info.folders.push(f.path);
//       }
//     });
//     const currentFile = info.folders.pop();
//     info.projects.pop();
//     info.folderPath = currentFile.path;
//     info.name = currentFile.name;
