const fs = require('fs');
const csvWriter = require('csv-write-stream');

const uploader = (info, callback) => {
  const {
    tags, date, title, outputPath,
  } = info;
  const description = info.vidDescription;
  let writer;
  if (!fs.existsSync(`${outputPath}/trackinfo.csv`)) {
    writer = csvWriter({ headers: ['track', 'title', 'date', 'description', 'tags', 'privacyStatus'] });
  } else {
    writer = csvWriter({ sendHeaders: false });
  }
  writer.pipe(fs.createWriteStream(`${outputPath}/trackinfo.csv`, { flags: 'a' }));
  writer.write({
    track: info.name,
    title,
    date,
    description,
    tags,
    privacyStatus: 'private',
  });
  writer.end();
  callback(null);
};

module.exports = uploader;
