/* eslint-disable no-param-reassign */
const {
  fs, mp3, zip, mp4, upload,
} = require('./sanitizeImports');

const ops = {
  mp3, zip, mp4, upload,
};

module.exports = (info) => {
  info.folderPath = info.folderPath.replace('\n', '').split(String.fromCharCode(92)).join('');
  info.imagePath = info.mp4 ? info.imagePath.replace('\n', '').split(String.fromCharCode(92)).join('') : '';
  info.tasks = Object.keys(info).filter((x) => ['mp4', 'mp3', 'zip', 'upload'].includes(x) && info[x]);
  info.tasks = info.tasks.map((x) => [x, ops[x]]);
  info.projects = [info.folderPath];
  info.images = [info.imagePath];
  info.tags = info.tags.split(',');
  info.dates = new Array(7).fill(new Date())
    .map((date) => {
      date.setHours(9, 0, 0, 0);
      date.setDate(date.getDate() + 1);
      const time = date.toISOString();
      return time;
    });

  if (!info.single) {
    const folder = info.projects.pop();
    fs.readdirSync(folder).forEach((file) => {
      const fname = `${info.folderPath}/${file}`;
      if (fs.statSync(fname).isDirectory()) {
        info.projects.push(fname);
      }
    });
    fs.readdirSync(info.images.pop()).forEach((image) => {
      const imagePath = `${info.imagePath}/${image}`;
      if (image[0] !== '.' && !fs.statSync(imagePath).isDirectory()) {
        info.images.push(imagePath);
      }
    });
  }

  info.folderPath = info.projects.pop();
  info.imagePath = info.images[Math.floor(Math.random() * info.images.length)];
  info.name = info.folderPath.split('/').pop();
  [info.beatName] = info.name.split(' (prod. barlitxs)');
  info.title = `${info.title} ${info.beatName}`;
  const titleArr = info.title.split('');
  while (titleArr.length > 100) {
    titleArr.pop();
    info.title = titleArr.join('');
  }
  return info;
};
