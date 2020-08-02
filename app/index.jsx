/* eslint-disable no-nested-ternary */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

const $ = require('jquery');

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const defaultInfo = {
  single: true, type: Math.random().toString(36).substr(2, getRndInteger(4, 12)), mp3: true, mp4: true, zip: true, folderPath: '/Users/carlitoswillis/Downloads/testinglongername (prod. barlitxs) 123 bpm Cb Major', imagePath: '/Users/carlitoswillis/Downloads/pics/samurai-jack.jpeg',
};

const DropArea = ({
  path, loaded, name, handleDrop, handleDragOver, handleDragEnter, handleDragLeave,
}) => (
  <div>
    {loaded
      ? (
        <div
          className="dropArea grayArea"
          id={path}
          onDrop={(e) => handleDrop(e)}
          onDragOver={(e) => handleDragOver(e)}
          onDragEnter={(e) => handleDragEnter(e)}
          onDragLeave={(e) => handleDragLeave(e)}
        >
          <p className="dropLabel">
            {name}
            {' '}
            loaded here
          </p>
        </div>
      )
      : (
        <div
          className="dropArea"
          id={path}
          onDrop={(e) => handleDrop(e)}
          onDragOver={(e) => handleDragOver(e)}
          onDragEnter={(e) => handleDragEnter(e)}
          onDragLeave={(e) => handleDragLeave(e)}
        >
          <p className="dropLabel">Drop Folder Here</p>
        </div>
      )}
  </div>
);

const SearchArea = ({
  platform, handleChange, handleSubmit, results,
}) => (
  <div className={platform.toLowerCase()}>
    <h2>
      Search for Similar Artists on
      {' '}
      {platform}
    </h2>
    <div id={`${platform.toLowerCase()}Search`} className="search">
      <input onChange={(e) => handleChange(e)} id={`${platform.toLowerCase()}SearchBox`} className="searchBox" type="text" />
      <button onClick={(e) => handleSubmit(e)} id={`${platform.toLowerCase()}SearchButton`} className="go" type="submit">Search</button>
    </div>
    <div id={`${platform.toLowerCase()}Results`} className="results">
      {results.map((artist) => (
        artist.originalSearch
          ? (
            <div key={artist.id} id={artist.id} className="searchedArtist">
              <a href={artist.images[1] ? artist.images[1].url : artist.images[0] ? artist.images[0].url : `https://www.google.com/search?q=picture+of+${artist}`} rel="noreferrer" target="_blank"><img className="artistPic searchedArtistPic" src={artist.images[1] ? artist.images[1].url : artist.images[0] ? artist.images[0].url : 'https://merriam-webster.com/assets/mw/images/article/art-wap-article-main/egg-3442-e1f6463624338504cd021bf23aef8441@1x.jpg'} alt={artist.name} /></a>
              <div className="artistName">
                <a href={artist.external_urls.spotify} rel="noreferrer" target="_blank">
                  {artist.name}
                </a>
              </div>
              <p className="followers">
                followers:
                {' '}
                {artist.followers.total}
              </p>
              <p className="genres">
                genres:
                {' '}
                {JSON.stringify(artist.genres)}
              </p>
            </div>
          )
          : (
            <div key={artist.id} id={artist.id} className="result">
              <a href={artist.images[0] ? artist.images[0].url : `https://www.google.com/search?q=picture+of+${artist}`} rel="noreferrer" target="_blank"><img className="artistPic" src={artist.images[0] ? artist.images[0].url : 'https://merriam-webster.com/assets/mw/images/article/art-wap-article-main/egg-3442-e1f6463624338504cd021bf23aef8441@1x.jpg'} alt={artist.name} /></a>
              <div className="artistName">
                <a href={artist.external_urls.spotify} rel="noreferrer" target="_blank">
                  {artist.name}
                </a>
              </div>
              <p className="followers">
                followers:
                {' '}
                {artist.followers.total}
              </p>
              <p className="genres">
                genres:
                {' '}
                {JSON.stringify(artist.genres)}
              </p>
            </div>
          )
      ))}
    </div>
  </div>
);

class App extends Component {
  constructor(props) {
    super(props);

    const info = { ...defaultInfo };
    // info.folderPath = '/Users/carlitoswillis/Downloads/bulk';
    // info.imagePath = '/Users/carlitoswillis/Downloads/pics';
    // info.single = false;

    // processFiles(inf);
    this.state = { info, spotifyResults: [], youtubeResults: [] };
  }

  componentDidMount() {
    console.log('mounted');
  }

  handleStart() {
    const { info } = this.state;
    const settings = {
      url: 'http://localhost:3000/start',
      method: 'POST',
      timeout: 0,
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(info),
    };

    $.ajax(settings).done((response) => {
      console.log(response);
      const resetInfo = { ...info };
      resetInfo.folderPath = undefined;
      resetInfo.imagePath = undefined;
      if (response === 'success') {
        this.setState({
          info: resetInfo,
        });
      }
    });
  }

  handleCheckbox(e) {
    console.log(e);
    const { info } = this.state;
    const updatedInfo = { ...info };
    updatedInfo[e.target.id] = e.target.checked;
    this.setState({ info: updatedInfo });
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const { info } = this.state;
    const updatedInfo = { ...info };
    updatedInfo[e.target.id] = e.dataTransfer.files[0].path;
    this.setState({ info: updatedInfo });
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const { info } = this.state;
    const updatedInfo = { ...info };
    this.setState({ info: updatedInfo });
  }

  handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    const { info } = this.state;
    const updatedInfo = { ...info };
    this.setState({ info: updatedInfo });
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const { info } = this.state;
    const updatedInfo = { ...info };
    this.setState({ info: updatedInfo });
  }

  handleChange(e) {
    e.preventDefault();
    e.stopPropagation();
    const { info } = this.state;
    const updatedInfo = { ...info };
    updatedInfo[e.target.id] = e.target.value;
    this.setState({ info: updatedInfo });
  }

  handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    const { info } = this.state;
    const searchTerm = info[`${e.target.id.split('SearchButton')[0]}SearchBox`];
    const endpoint = e.target.id.split('SearchButton')[0];
    if (searchTerm === '') {
      const state = { info };
      state[`${endpoint}Results`] = [];
      this.setState(state);
    } else {
      const settings = {
        url: `http://localhost:3000/${endpoint}?searchTerm=${searchTerm}`,
        method: 'GET',
        timeout: 0,
      };
      $.ajax(settings).done((response) => {
        const resetInfo = { ...info };
        resetInfo.folderPath = undefined;
        resetInfo.imagePath = undefined;
        const state = { info: resetInfo };
        state[`${endpoint}Results`] = response;
        this.setState(state);
      });
    }
  }

  handleChangeMode() {
    const { info } = this.state;
    const updatedInfo = { ...info };
    updatedInfo.single = !updatedInfo.single;
    this.setState({ info: updatedInfo });
  }

  handleClear() {
    const { info } = this.state;
    const updatedInfo = { ...info };
    updatedInfo.folderPath = undefined;
    updatedInfo.imagePath = undefined;
    const state = { info: updatedInfo, spotifyResults: [], youtubeResults: [] };
    this.setState(state);
  }

  handleLogin() {
    this.setState({
      loggedIn: true,
    });
  }

  render() {
    const {
      loaded, info, spotifyResults, youtubeResults, loggedIn,
    } = this.state;
    return (
      <div>
        <h1>BeatPack</h1>
        <h3 id="mode">{info.single ? 'Single Mode' : 'Bulk Mode'}</h3>
        <div className="container">
          <DropArea path="folderPath" loaded={loaded} data={info.folderPath} handleDrop={this.handleDrop.bind(this)} handleDragOver={this.handleDragOver.bind(this)} handleDragEnter={this.handleDragEnter.bind(this)} handleDragLeave={this.handleDragLeave.bind(this)} />
          <DropArea path="imagePath" loaded={loaded} data={info.imagePath} handleDrop={this.handleDrop.bind(this)} handleDragOver={this.handleDragOver.bind(this)} handleDragEnter={this.handleDragEnter.bind(this)} handleDragLeave={this.handleDragLeave.bind(this)} />
        </div>
        <div className="checkboxes">
          <div className="options">
            <p className="checkboxLabel">mp3ify</p>
            <input onClick={(e) => this.handleCheckbox(e)} className="features" defaultChecked id="mp3" type="checkbox" />
          </div>
          <div className="options">
            <p className="checkboxLabel">zip</p>
            <input onClick={(e) => this.handleCheckbox(e)} className="features" defaultChecked id="zip" type="checkbox" />
          </div>
          <div className="options">
            <p className="checkboxLabel">mp4ify</p>
            <input onClick={(e) => this.handleCheckbox(e)} className="features" defaultChecked id="mp4" type="checkbox" />
          </div>
          {/* <div className="options">
            <p className="checkboxLabel">upload</p>
            <input onClick={(e) => this.handleCheckbox(e)} className="features" defaultChecked id="uploadToYT" type="checkbox" />
          </div> */}
        </div>
        <div id="typebeatdiv" className="typebeatdiv">
          <input onChange={(e) => this.handleChange(e)} id="type" className="typebeatSearch" type="text" placeholder="type beat" />
        </div>
        <div className="buttonHolder">
          <div onClick={() => { this.handleStart(); }} onKeyDown={() => { this.handleStart(); }} className="buttons go" id="start">
            <p>
              Start
            </p>
          </div>
          <div onClick={() => { this.handleChangeMode(); }} onKeyDown={() => { this.handleChangeMode(); }} className="buttons" id="quantity">
            <p id="quantityText">
              {!info.single ? 'Single Mode' : 'Bulk Mode'}
            </p>
          </div>
          <div onClick={() => { this.handleClear(); }} onKeyDown={() => { this.handleClear(); }} className="buttons" id="flush">
            <p>
              Reset Files
            </p>
          </div>
        </div>
        {loggedIn
          ? <div />
          : (
            <div onClick={() => { this.handleLogin(); }} onKeyDown={() => { this.handleLogin(); }} className="buttons ytbtn" id="youtubeLogin">
              <p>
                YouTube Login
              </p>
            </div>
          )}
        <SearchArea platform="Spotify" results={spotifyResults} handleSubmit={this.handleSubmit.bind(this)} handleChange={this.handleChange.bind(this)} />
        <SearchArea platform="Youtube" results={youtubeResults} handleSubmit={this.handleSubmit.bind(this)} handleChange={this.handleChange.bind(this)} />
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app'),
);
