let search = 'drake';

process.stdin.on('data', (input) => {
  search = input;
  start();
})

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const util = require('util');

const key = require('./spotKey');
key.header = 'Bearer null';

const searchArtist = (input, callback) => {
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4) {
      let artist;
      if (JSON.parse(this.responseText).error) {
        key.getKey((err, res) => {
          key.header = res;
          searchArtist(input, callback);
        });
      } else {
        artist = JSON.parse(this.responseText).artists.items.reduce( (x, y) => x.popularity >= y.popularity ? x : y);
        callback(null, artist);
      }
    }
  });
  xhr.open("GET", `https://api.spotify.com/v1/search?q=${input}&type=artist&limit=10`);
  xhr.setRequestHeader("Authorization", key.header);
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
        callback(null, similarArtists);
      }
    }
  });
  xhr.open("GET", `https://api.spotify.com/v1/artists/${id}/related-artists`);
  xhr.setRequestHeader("Authorization", key.header);
  xhr.send();
}


const simi = util.promisify(getRelatedArtists);

const start = () => {
  searchArtist(search, (err, artist) => {
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

    // work on these promises, nested promises are an issue... also, make sure it doesnt just do one artists simi over and over...
    simi(artist.id)
      .then(artists => {
        let similarArtists = [];
        let original = [...artists];
        for (artist of artists) {
          similarArtists.push(simi(artist.id));
        }
        return Promise.all(similarArtists)
          .then(values => {
            const vals = values.concat(original);
            try {
              return vals.reduce((x, y) => x.concat(y));
            } catch (e) {
              return [...original].concat(values);
            }
          })
      })
      .then(artists => {
        let similarArtists = [];
        let original = [...artists];
        for (artist of artists) {
          similarArtists.push(simi(artist.id));
        }
        return Promise.all(similarArtists)
          .then(values => {
            const vals = values.concat(original);
            try {
              return vals.reduce((x, y) => x.concat(y));
            } catch (e) {
              return [...original].concat(values);
            }
          })
      })
      .then(things => {
        let newthings = new Set();
        for (t of things) {
          newthings.add(JSON.stringify(t));
        }
        newthings = Array.from(newthings).map(x => JSON.parse(x));
        const newarry = newthings.filter( g => testGenre(genres, g.genres) >= .5);
        newarry.sort((b, c) => b.followers.total <= c.followers.total ? 1 : -1)
        newarry.forEach((x) => {
          console.log(x.name);
          // console.log('name: ', x.name);
          // console.log('\nfans: ', x.followers.total);
        })
        console.log(newarry.length, 'similar (by genre) artists out of', newthings.length, 'found');
      })
  });
}

