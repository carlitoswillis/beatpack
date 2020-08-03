/* eslint-disable no-console */
const childProc = require('child_process');
const express = require('express');
const handler = require('./process');
const spotify = require('./spotify');
const youtube = require('./youtube/auth');

const app = express();
app.set('view engine', 'ejs');

app.use(express.json());

app.use('/loggedin', express.static('public'));
app.get('/yttoken', (req, res) => {
  res.json();
});
app.get('/', youtube.login);
app.get('/logout', youtube.logout);
app.get('/oath2callback', (req, res) => {
  youtube.callbackHandler(req, res, () => {
    youtube.authed = true;
  });
});

app.post('/start', (req, res) => {
  handler(req.body, () => {
    res.end('success');
  });
});

app.get('/spotify', (req, res) => {
  spotify(req.query.searchTerm, (err, results) => {
    if (err) {
      res.send([]);
      console.error(err);
    } else {
      res.send(results);
    }
  });
});

app.get('/chrome', (req, res) => {
  childProc.exec('open -a "Google Chrome" http://localhost:5000', (err) => {
    if (err) console.error(err);
    res.end('success');
  });
});

app.listen(5000, (err) => {
  if (err) throw err;
  console.log('http://localhost:5000');
});
