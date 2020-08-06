let search;

process.stdin.on('data', (input) => {
  search = input;
  start();
});

const { XMLHttpRequest } = require('xmlhttprequest');
const util = require('util');

const key = require('./spotKey');

key.header = 'Bearer null';

const searchArtist = (input, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.addEventListener('readystatechange', function () {
    if (this.readyState === 4) {
      let artist;
      if (JSON.parse(this.responseText).error) {
        key.getKey((err, res) => {
          key.header = res;
          searchArtist(input, callback);
        });
      } else {
        artist = JSON.parse(this.responseText).artists.items.reduce((x, y) => (x.popularity >= y.popularity ? x : y));
        // artist = JSON.parse(this.responseText).artists.items.filter(x => x.id === '51Y9uMxhciB1I5qIAhJs8q')[0];
        artist.originalSearch = true;
        callback(null, { id: artist.id, artist });
      }
    }
  });
  xhr.open('GET', `https://api.spotify.com/v1/search?q=${input}&type=artist`);
  xhr.setRequestHeader('Authorization', key.header);
  xhr.send();
};

const getRelatedArtists = (artistInfo, callback) => {
  const { id, artist } = artistInfo;
  const xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  xhr.addEventListener('readystatechange', function () {
    if (this.readyState === 4) {
      const similarArtists = JSON.parse(this.responseText).artists;
      if (!similarArtists) {
        callback(null, []);
      } else {
        similarArtists.push(artist);
        callback(null, similarArtists);
      }
    }
  });
  xhr.open('GET', `https://api.spotify.com/v1/artists/${id}/related-artists`);
  xhr.setRequestHeader('Authorization', key.header);
  xhr.send();
};

const simi = util.promisify(getRelatedArtists);
// simi = memoize(simi);

const start = (searchTerm, callback) => {
  searchArtist(searchTerm, (err, artistInfo) => {
    if (err) throw err;
    const { id, artist } = artistInfo;
    const originalArtist = artist;
    console.log('artist: ', artist.name, '\nid: ', artist.id);
    const { genres } = artist;
    const testGenre = (g1, g2) => {
      let count = 0;
      for (g of g1) {
        if (g2.includes(g)) {
          count++;
        }
      }
      return count / g2.length;
    };

    simi(artistInfo)
      .then((artists) => {
        const similarArtists = [];
        const original = [...artists];
        for (element of artists) {
          similarArtists.push(simi({ id: element.id, artist: element }));
        }
        return Promise.all(similarArtists)
          .then((values) => {
            const vals = values.concat(original);
            try {
              return vals.reduce((x, y) => x.concat(y));
            } catch (e) {
              return [...original].concat(values);
            }
          });
      })
      .then((artists) => {
        const similarArtists = [];
        const original = [...artists];
        for (element of artists) {
          similarArtists.push(simi({ id: element.id, artist: element }));
        }
        return Promise.all(similarArtists)
          .then((values) => {
            const vals = values.concat(original);
            try {
              return vals.reduce((x, y) => x.concat(y));
            } catch (e) {
              return [...original].concat(values);
            }
          });
      })
      .then((things) => {
        let newthings = new Set();
        things.forEach((t) => {
          newthings.add(JSON.stringify(t));
        });
        newthings = Array.from(newthings).map((x) => JSON.parse(x));
        newthings.sort((b, c) => (b.followers.total <= c.followers.total ? 1 : -1));
        newthings.unshift(originalArtist);
        callback(null, newthings);
      });
  });
};

module.exports = start;
