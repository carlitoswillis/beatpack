/* eslint-disable no-console */
const util = require('util');

module.exports = (info, callback) => {
  const { tasks } = info;
  tasks.push(['finishing', () => callback()]);

  const recurse = (index = 0) => {
    // console.log(`starting ${tasks[index][0]} process`);
    info.event.sender.send('working', `working on ${tasks[index][0]}`);
    // info.event.sender.send('working', util.inspect(info));
    tasks[index][1](info, (err) => {
      if (err) info.event.sender.send('working', JSON.stringify(err));
      info.event.sender.send('task-finished', `${tasks[index][0]}`);
      // console.log(`finished ${tasks[index][0]} process`);
      recurse(index + 1);
    });
  };
  recurse();
};
