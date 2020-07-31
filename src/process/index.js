const { fs, sanitize, mp3, zip, mp4, util, asyncMap } = require('./imports');
const ops = { mp3, zip, mp4 };

const handleSingle = (info, callback) => {
  console.log(`starting ${info.name}`);
  asyncMap(info, () => {
    callback();
    console.log(`finished ${info.name}`);
  })
}

const handleFolder = (info) => {
  handleSingle(info, () => {
    if (info.projects.length > 0) {
      info.folderPath = info.projects.pop();
      info.name = info.folderPath.split('/').pop();
      handleFolder(info);
    } else {
      console.log('completed all tasks');
    }
  });
}

module.exports = (info) => {
  sanitize(info);
  info.tasks = info.tasks.map(x => [x, ops[x]]);
  handleFolder(info);
}
