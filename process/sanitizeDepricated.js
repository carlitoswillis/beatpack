/* eslint-disable no-param-reassign */
const {
  fs, mp3, zip, makeCover, mp4, upload, cleanUp, // makecover, delete files?
} = require('./sanitizeImports');

const ops = {
  mp3, zip, makeCover, mp4, upload, cleanUp,
};

const cleanPath = (input) => {
  if (input) {
    return input.replace('\n', '')
      .split(String.fromCharCode(92))
      .join('');
  }
  return undefined;
};

const nextImage = (info) => {
  let count = 0;
  const cap = info.images.length;
  return function () {
    count = (count + 1) % cap;
    return info.images[count];
  };
};

const nextBeat = function () {
  this.folderPath = this.projects.pop();
  this.imagePath = this.nextImage();
  this.name = this.folderPath.split('/').pop();
  [this.beatName, this.bpm] = this.name.split(' (prod. barlitxs) ');
  [this.bpm, this.key] = this.bpm.split(' bpm ');
  this.videoPath = `${this.folderPath}/${this.name}.mp4`;
  this.date = this.dates.shift();
  this.title = `${this.title} ${this.beatName}`;
  const titleArr = this.title.split('');
  while (titleArr.length > 100) {
    titleArr.pop();
    this.title = titleArr.join('');
  }
  this.searchKeyword = `${this.beatName.split(' ').join('%20')}%20${this.type.split(' ').join('%20')}`;
  this.vidDescription = `${this.title} available for download\nFree Download or Purchase: https://player.beatstars.com/?storeId=71006&search_keyword=${this.searchKeyword}\n\nig: http://instagram.com/barlitxs\ntwitter: http://twitter.com/barlitxs\nsoundcloud: http://soundcloud.com/barlitxs\n\n${this.title}\nprod. barlitxs\n\n${this.description || ''}\n\n${this.tags}`;
};

const sanitize = (info) => {
  info.folderPath = cleanPath(info.folderPath);
  info.imagePath = cleanPath(info.imagePath);
  info.outputPath = cleanPath(info.outputPath);
  // map tasks
  info.tasks = ['mp3', 'zip', 'makeCover', 'mp4', 'upload', 'cleanUp']
    .filter((x) => Object.keys(info)
      .includes(x) && info[x])
    .map((x) => [x, ops[x]]);
  // queues for projects && images
  info.projects = [info.folderPath];
  info.images = [info.imagePath];
  // youtube information
  info.tags = info.tags.split(', ').join(',').split(',');
  info.dates = new Array(7)
    .fill(new Date(info.startDate || new Date()))
    .map((date) => {
      date.setHours(info.startTime
        .split(':')[0],
      info.startTime
        .split(':')[1], 0, 0);
      date.setDate(date.getDate() + 1);
      const time = date.toISOString();
      return time;
    });
  // prep for bulk
  info.nextImage = nextImage(info);
  info.nextBeat = nextBeat;
  if (!info.single) {
    const folder = info.projects.pop();
    fs.readdirSync(folder)
      .forEach((file) => {
        const fname = `${info.folderPath}/${file}`;
        if (fs.statSync(fname).isDirectory()) {
          info.projects.push(fname);
        }
      });
    fs.readdirSync(info.images.pop())
      .forEach((image) => {
        const imagePath = `${info.imagePath}/${image}`;
        if (image[0] !== '.' && !fs.statSync(imagePath).isDirectory()) {
          info.images.push(imagePath);
        }
      });
  }
  info.nextImage();
  info.nextBeat();
  return info;
};

module.exports = sanitize;
