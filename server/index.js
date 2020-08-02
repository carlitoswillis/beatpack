const express = require('express');
const path = require('path');
const handler = require('./process');
const spotify = require('./spotify');
const youtube = require('./youtube');

const app = express();
// app.set('view engine', 'ejs');

app.use(express.json());

// app.get('/', youtube.login);
// app.get('/logout', youtube.logout);
// app.get('/google/callback', youtube.callbackHandler);

app.use(express.static('public'));

app.post('/start', (req, res) => {
  handler(req.body, () => {
    res.end('success');
  });
});

app.get('/spotify', (req, res) => {
  spotify(req.query.searchTerm, (err, results) => {
    if (err) {
      console.error(err);
      res.send([]);
    } else {
      res.send(results);
    }
  });
});

app.listen(3000, (err) => {
  if (err) throw err;
  console.log('http://localhost:3000');
});
