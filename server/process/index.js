/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
const {
  sanitize, asyncMap,
} = require('./imports');

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
  sanitize(info);
  console.log(info);
  handleFolder(info, callback);
};
