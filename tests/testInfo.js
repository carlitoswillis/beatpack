module.exports = (bulk) => {
  const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const info = {
    single: true, type: Math.random().toString(36).substr(2, getRndInteger(4, 12)), mp3: true, mp4: true, zip: true, upload: false, outputPath: '/Users/carlitoswillis/Google Drive (carlitoswillis@berkeley.edu)/Track Outs/processed', folderPath: '/Users/carlitoswillis/Downloads/testinglongername (prod. barlitxs) 123 bpm Cb Major', imagePath: '/Users/carlitoswillis/Downloads/pics/drake.jpg', date: new Date(), tags: 'tags, go, here', title: 'title goes here', imagePathFiles: [], folderPathFiles: [], startDate: '2020-10-31', startTime: '9:29', makeCover: true, delete: false,
  };
  // info.type = 'Tyla Yaweh';
  // imagePath: '/Users/carlitoswillis/Downloads/tylah yaweh/TY_2020_PUB_PhotoChrisVilla_L1109.jpg',
  if (bulk) {
    info.folderPath = '/Users/carlitoswillis/Downloads/bulk';
    info.imagePath = '/Users/carlitoswillis/Downloads/pics';
    info.single = false;
  }
  return info;
};
