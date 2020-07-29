const header = require('./spotKey');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const util = require('util');

const searchArtist = (input, callback) => {
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4) {
      const artist = JSON.parse(this.responseText).artists.items.reduce( (x, y) => x.popularity >= y.popularity ? x : y);
      callback(null, artist);
    }
  });

  xhr.open("GET", `https://api.spotify.com/v1/search?q=${input}&type=artist&limit=10`);
  xhr.setRequestHeader("Authorization", header);
  xhr.send();
}

const getRelatedArtists = (id, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4) {

      let similarArtists = JSON.parse(this.responseText).artists;
      const artists = similarArtists.map(artist => {
        return { name: artist.name, popularity: artist.popularity, id: artist.id, fans: artist.followers.total, genres: artist.genres }
      });

      callback(null, artists);
    }
  });
  xhr.open("GET", `https://api.spotify.com/v1/artists/${id}/related-artists`);
  xhr.setRequestHeader("Authorization", header);
  xhr.send();
}


const simi = util.promisify(getRelatedArtists);

searchArtist('drake', (err, artist) => {
  if (err) throw err;
  console.log('artist: ', artist.name, '\nid: ', artist.id);

  simi(artist.id)
    .then(artists => {
      const similarArtists = [];
      for (artist of artists) {
        similarArtists.push(artist);
        similarArtists.push(simi(artist.id));
      }
      return Promise.all(similarArtists)
        .then( (y) => {
          return y;
        });
    })
    .then(things => {
      console.log(things.length);
    })
});

