/* eslint-disable no-console */
const cp = require('child_process');
const express = require('express');
const handler = require('./process');
const spotify = require('./spotify');
const youtube = require('./youtube/auth');
const { tokens } = require('./youtube/tokens');

cp.exec(`
    if pgrep -xq -- com.docker.hyperkit; then
        echo running
    else
        echo not running
    fi`, (err, data) => {
  if (err) console.error(err);
  if (data.includes('not')) {
    cp.exec('open -a "Docker Desktop"', (error) => {
      if (error) console.log('Docker Could Not Start\nVideo Functionality Requires Docker Or FFMPEG', error);
    });
  }
});
if (tokens.expiry_date > Date.now()) {
  cp.exec('open -a "Google Chrome" http://localhost:5000/login', (err) => {
    if (err) console.error(err);
  });
} else {
  console.log('youtube tokens good');
}
const app = express();
app.use(express.json());
app.set('view engine', 'ejs');

app.use('/', express.static('public'));

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

app.get('/login', youtube.login);
app.get('/logout', youtube.logout);
app.get('/chrome', (req, res) => {
  cp.exec('open -a "Google Chrome" http://localhost:5000/login', (err) => {
    if (err) console.error(err);
    res.end('success');
  });
});

app.listen(5000, (err) => {
  if (err) throw err;
  console.log('http://localhost:5000');
});
