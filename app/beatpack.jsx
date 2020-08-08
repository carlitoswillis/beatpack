import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/app';

const test = require('../tests/testInfo')();

ReactDOM.render(
  // <App data={test} />,
  <App data={test} />,
  // <App />,
  document.getElementById('app'),
);
