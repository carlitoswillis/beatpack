const fs = require('fs');
const { google } = require('googleapis');
const multer = require('multer');
const OAuth2Data = require('./credentials.json');

let title;
let description;
let tags = [];

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

const Storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, './videos');
  },
  filename(req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage: Storage,
}).single('file'); // Field name and max count

const login = (req, res) => {
  if (!authed) {
    // Generate an OAuth URL and redirect there
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log(url);
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
        console.log(response.data);
        name = response.data.name;
        pic = response.data.picture;
        res.render('success', {
          name: response.data.name,
          pic: response.data.picture,
          success: false,
        });
      }
    });
  }
};

// app.post('/upload', (req, res) => {
//   upload(req, res, (err) => {
//     if (err) {
//       console.log(err);
//       return res.end('Something went wrong');
//     }
//     console.log(req.file.path);
//     title = req.body.title;
//     description = req.body.description;
//     tags = req.body.tags;
//     console.log(title);
//     console.log(description);
//     console.log(tags);
//     const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
//     console.log(youtube);
//     youtube.videos.insert(
//       {
//         resource: {
//           // Video title and description
//           snippet: {
//             title,
//             description,
//             tags,
//           },
//           // I don't want to spam my subscribers
//           status: {
//             privacyStatus: 'private',
//           },
//         },
//         // This is for the callback function
//         part: 'snippet,status',

//         // Create the readable stream to upload the video
//         media: {
//           body: fs.createReadStream(req.file.path),
//         },
//       },
//       (err, data) => {
//         if (err) throw err;
//         console.log(data);
//         console.log('Done.');
//         fs.unlinkSync(req.file.path);
//         res.render('success', { name, pic, success: true });
//       },
//     );
//   });
// });

const logout = (req, res) => {
  authed = false;
  res.redirect('/');
};

const callbackHandler = (req, res) => {
  const { code } = req.query;
  if (code) {
    // Get an access token based on our OAuth code
    oAuth2Client.getToken(code, (err, tokens) => {
      if (err) {
        console.log('Error authenticating');
        console.log(err);
      } else {
        console.log('Successfully authenticated');
        console.log(tokens);
        oAuth2Client.setCredentials(tokens);

        authed = true;
        res.redirect('http://localhost:3000');
      }
    });
  }
};

module.exports = {
  callbackHandler, login, logout,
};
