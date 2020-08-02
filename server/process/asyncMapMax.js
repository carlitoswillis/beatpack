module.exports = (info, callback) => {
  const { tasks } = info;
  tasks.push(['finishing', () => callback()]);
  var recurse = function(index = 0) {
    console.log(`starting ${tasks[index][0]} process`);
    tasks[index][1](info, () => {
      console.log(`finished ${tasks[index][0]} process`);
      recurse(index + 1);
    });
  }
  recurse();
};
