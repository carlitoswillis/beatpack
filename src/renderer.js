const $ = require('jquery');
const { ipcRenderer } = require('electron');
const processFiles = require('../src/process');
const searchSpotify = require('../src/spotify');
const { folder, image, quantityButton, resetButton, results, typebeatSearch,
startButton, checkboxes, searchBox, searchButton, searchedArtist } = require('../src/elements');

let info = { single: true, type: 'undefined' };

const checkboxSet = () => {
  [...checkboxes].forEach((x) => {
    x.addEventListener('click', (e) => {
      info[e.target.id] = e.target.checked;
    });
    info[x.id] = x.checked;
  })
}

const wipe = () => {
  info = { single: info.single };
  for (let element of [folder, image]) {
    element.className = 'dropArea';
  }
}

checkboxSet();

for (let element of [folder, image]) {
  let path;
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    for (let f of e.dataTransfer.files) {
      path = f.path;
    }
    ipcRenderer.send('dragstart', path);
    info[element.id] = path;
    if (e.target.tagName === 'DIV') {
      e.target.className = 'dropArea grayArea';
    }
  });
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.tagName === 'DIV') {
      e.target.className = 'dropArea hoveredDrop'
    }
  });
  element.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.tagName === 'DIV') {
      e.target.className = 'dropArea';
    }
  });
}

const updateTypeBeat = () => {
  info.type = typebeatSearch.value;
  console.log(info);
}

typebeatSearch.addEventListener("change", updateTypeBeat);

quantityButton.addEventListener('click', (e) => {
  info.single = !info.single;
  let [ value, other ] = info.single ? ['Single Mode', 'Bulk Mode'] : ['Bulk Mode', 'Single Mode'];
  document.getElementById('mode').innerText = value;
  document.getElementById('quantityText').innerText = other;
});

resetButton.addEventListener('click', wipe);

startButton.addEventListener('click', (e) => {
  updateTypeBeat();
  if (info.folderPath && ( info.mp4 && info.imagePath || !info.mp4 )) {
    try {
      processFiles({...info});
    } catch (e) {
      console.error(e);
    }
  }
  wipe();
  checkboxSet();
});

searchButton.addEventListener('click', (e) => {
  results.innerHTML = '';
  searchedArtist.innerHTML = '';
  searchSpotify(searchBox.value, (err, artists) => {
    if (err) throw err;
    for (artist of artists) {
      if (artist.originalSearch) {
        const linktoartistimg = artist.images[1] ? artist.images[1].url : artist.images[0].url
        $("#searchedArtist").append(`
            <div id=${artist.id} class="searchedArtist">
              <a href="${linktoartistimg}"><img class="artistPic" src="${linktoartistimg}" alt="${artist.name}"></a>
              <div class="artistName"><a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a></div>
              <p class="genres">genres: ${JSON.stringify(artist.genres)}</p>
            </div>
          `);
      } else {
        try {
          $("#results").append(`
            <div id=${artist.id} class="result">
            <a href="${artist.images[0].url}"><img class="artistPic" src="${artist.images[0].url}" alt="${artist.name}"></a>
              <div class="artistName"><a href="${artist.external_urls.spotify}" target="_blank">${artist.name}</a></div>
              <p class="followers">followers: ${artist.followers.total}</p>
              <p class="genres">genres: ${JSON.stringify(artist.genres)}</p>
            </div>
          `);
        } catch (e) {
          console.error(e);
        }
      }
    }
  });
});

const inf = {...info, folderPath: '/Users/carlitoswillis/Downloads/testinglongername (prod. barlitxs) 123 bpm Cb Major', imagePath: '/Users/carlitoswillis/Downloads/pics/samurai-jack.jpeg'};

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}
inf.type = Math.random().toString(36).substr(2, getRndInteger(4, 12))
// inf.type = 'tvrf'
// // const inf = {...info, folderPath: '/Users/carlitoswillis/Downloads/bulk', imagePath: '/Users/carlitoswillis/Downloads/pics'};
// // inf.single = false;

processFiles(inf);
