const fs = require('fs');

module.exports = (info) => {
  info.folderPath = info.folderPath.replace('\n', '').split(String.fromCharCode(92)).join('');
  info.imagePath = info.mp4 ? info.imagePath.replace('\n', '').split(String.fromCharCode(92)).join('') : '';
  info.tasks = Object.keys(info).filter(x => ['mp4', 'mp3', 'zip'].includes(x) && info[x]);
  info.projects = [];

  if (info.single) {
    info.name = info.folderPath.split('/').pop();
  } else {
    const files = fs.readdirSync(info.folderPath)
    for (let f of files) {
      const fname = `${info.folderPath}/${f}`;
      if (fs.statSync(fname).isDirectory()) {
        info.projects.push(fname);
      }
    }
    info.folderPath = info.projects.pop();
    info.name = info.folderPath.split('/').pop();
  }
}
