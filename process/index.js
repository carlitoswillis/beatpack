/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
const path = require('path');

const { asyncMap } = require(path.resolve(__dirname, 'imports'));

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

module.exports = (data, callback) => {
  handleSingle(data, callback);
};
