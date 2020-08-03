/* eslint-disable no-console */
module.exports = (info, callback) => {
  const { tasks } = info;
  tasks.push(['finishing', () => callback()]);
  const recurse = (index = 0) => {
    console.log(`starting ${tasks[index][0]} process`);
    tasks[index][1](info, () => {
      console.log(`finished ${tasks[index][0]} process`);
      recurse(index + 1);
    });
  };
  recurse();
};
