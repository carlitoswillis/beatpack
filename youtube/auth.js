/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-shadow */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const { google } = require('googleapis');

const OAuth2Data = require(path.resolve(__dirname, 'credentials.json'));

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL,
);
let authed = false;

// If modifying these scopes, delete token.json.
const SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile';

const login = (req, res) => {
  if (!authed) {
    // Generate an OAuth URL and redirect there
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    res.render('index', { url });
  } else {
    const oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: 'v2',
    });
    oauth2.userinfo.get((err, response) => {
      if (err) {
        console.log(err);
      } else {
        console.log('user data\n', response.data, '\n');
        res.redirect('http://localhost:5000/beatpack.html');
      }
    });
  }
};

const logout = (req, res) => {
  authed = false;
  res.redirect('/');
};

const callbackHandler = (req, res, callback) => {
  const { code } = req.query;
  if (code) {
    // Get an access token based on our OAuth code
    oAuth2Client.getToken(code, (err, tokens) => {
      if (err) {
        console.log('Error authenticating');
        console.log(err);
      } else {
        console.log('Successfully authenticated');
        const tokenJson = fs.createWriteStream('./server/youtube/tokens.json');
        tokenJson.write(JSON.stringify({ tokens }), () => {
          oAuth2Client.setCredentials(tokens, (err, data) => {
            if (err) throw err;
            console.log(data);
          });
          authed = true;
          res.redirect('http://localhost:5000/oath2callback');
          callback();
        });
      }
    });
  }
};

module.exports = {
  authed, callbackHandler, login, logout, oAuth2Client,
};
