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
      if (!similarArtists) {
        callback(null, []);
      } else {
        let artists = similarArtists.map(artist => {
          return { name: artist.name, popularity: artist.popularity, id: artist.id, fans: artist.followers.total, genres: artist.genres }
        });
        callback(null, artists);
      }
    }
  });
  xhr.open("GET", `https://api.spotify.com/v1/artists/${id}/related-artists`);
  xhr.setRequestHeader("Authorization", header);
  xhr.send();
}


const simi = util.promisify(getRelatedArtists);

searchArtist('trippie redd', (err, artist) => {
  if (err) throw err;
  console.log('artist: ', artist.name, '\nid: ', artist.id);
  const { genres } = artist;
  const testGenre = (g1, g2) => {
    let count = 0;
    for (g of g1) {
      if (g2.includes(g)) {
        count++;
      }
    }
    return count/g2.length;
  }
  simi(artist.id)
    .then(artists => {
      let similarArtists = [];
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
      console.log(things.length)
      let similarArtists = [];
      for (artist of things) {
        similarArtists.push(artist);
        similarArtists.push(simi(artist.id));
      }
      return Promise.all(similarArtists)
        .then( (y) => {
          return y;
        });
    })
    .then(things => {
      let newthings = new Set();
      for (thing of things) {
        if (!Array.isArray(thing)) {
          newthings.add(JSON.stringify(thing));
        } else {
          for (t of thing) {
            newthings.add(JSON.stringify(t));
          }
        }
      }
      newthings = Array.from(newthings).map(x => JSON.parse(x));
      const newarry = newthings.filter( g => testGenre(genres, g.genres) >= .5);
      newarry.sort((b, c) => b.popularity <= c.popularity ? 1 : -1)

      console.log(newarry);
    })
});

