import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';

const test = (bulk) => {
  const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const info = {
    single: true, type: Math.random().toString(36).substr(2, getRndInteger(4, 12)), mp3: false, mp4: true, zip: false, upload: false, folderPath: '/Users/carlitoswillis/Downloads/testinglongername (prod. barlitxs) 123 bpm Cb Major', imagePath: '/Users/carlitoswillis/Downloads/pics/drake.jpg', date: new Date(), tags: 'tags, go, here', title: 'title goes here', imagePathFiles: [], folderPathFiles: [], startDate: '2020-10-31', startTime: '9:29',
  };
  if (bulk) {
    info.folderPath = '/Users/carlitoswillis/Downloads/bulk';
    info.imagePath = '/Users/carlitoswillis/Downloads/pics';
    info.single = false;
  }
  return info;
};

ReactDOM.render(
  // <App testInfo={test()} />,
  <App />,
  document.getElementById('app'),
);
