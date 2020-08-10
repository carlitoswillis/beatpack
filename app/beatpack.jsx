import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';

// const customTitlebar = require('custom-electron-titlebar');

// window.addEventListener('DOMContentLoaded', () => {
//   const x = new customTitlebar.Titlebar({
//     backgroundColor: customTitlebar.Color.fromHex('#444'),
//     minimizable: true,
//     maximizable: true,
//     closeable: true,
//   });
//   return x;
// });
const test = require('../tests/testInfo')();

ReactDOM.render(
  // <App data={test} />,
  <App data={test} />,
  // <App />,
  document.getElementById('app'),
);
