module.exports = (info, callback) => {
  const { tasks } = info;
  tasks.push(['finishing', () => callback()]);
  const recurse = (index = 0) => {
    info.event.sender.send('working', `working on ${tasks[index][0]}`);
    tasks[index][1](info, (err) => {
      if (err) info.event.sender.send('err woring on recent task', JSON.stringify(err));
      info.event.sender.send('task-finished', `${tasks[index][0]}`);
      recurse(index + 1);
    });
  };
  recurse();
};
