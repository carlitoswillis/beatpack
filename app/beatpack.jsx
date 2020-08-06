import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';

const test = (bulk) => {
  const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const info = {
    single: true, type: Math.random().toString(36).substr(2, getRndInteger(4, 12)), mp3: false, mp4: true, zip: false, upload: false, folderPath: '/Users/carlitoswillis/Google Drive (carlitoswillis@berkeley.edu)/Track Outs/2020/the kid laroi x tyfontaine x pasto flocco x tyla yaweh/stupid (prod. barlitxs) 156 bpm E minor', imagePath: '/Users/carlitoswillis/Downloads/tylah yaweh/TY_2020_PUB_PhotoChrisVilla_L1109.jpg', date: new Date(), tags: 'tags, go, here', title: 'title goes here', imagePathFiles: [], folderPathFiles: [], startDate: '2020-10-31', startTime: '9:29',
  };
  // info.type = 'Tyla Yaweh';
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
