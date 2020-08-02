const {
  fs, sanitize, mp3, zip, mp4, util, asyncMap,
} = require('./imports');

const ops = { mp3, zip, mp4 };

const handleSingle = (info, callback) => {
  console.log(`starting ${info.name}`);
  asyncMap(info, () => {
    callback();
    console.log(`finished ${info.name}`);
  });
};

const handleFolder = (info, callback) => {
  handleSingle(info, () => {
    if (info.projects.length > 0) {
      info.folderPath = info.projects.pop();
      info.name = info.folderPath.split('/').pop();
      handleFolder(info);
    } else {
      console.log('completed all tasks');
      callback();
    }
  });
};

module.exports = (info, callback) => {
  const data = { ...info };
  sanitize(data);
  data.tasks = data.tasks.map((x) => [x, ops[x]]);
  handleFolder(data, callback);
};
