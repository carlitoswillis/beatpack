/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { Component } from 'react';
import DropArea from './droparea';
import SearchArea from './searcharea';
import CheckBoxes from './checkboxes';

const $ = require('jquery');

class App extends Component {
  constructor(props) {
    super(props);
    const { testInfo } = props;
    const defaultInfo = testInfo || {
      single: true, mp3: true, mp4: true, zip: true, upload: true, date: new Date(),
    };

    const info = { ...defaultInfo };
    this.state = { info, spotifyResults: [], youtubeResults: [] };
  }

  handleStart() {
    const { info } = this.state;
    const ready = info.folderPath && info.imagePath && info.type && info.tags && info.title;
    if (ready) {
      const settings = {
        url: 'http://localhost:5000/start',
        method: 'POST',
        timeout: 0,
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(info),
      };
      $.ajax(settings).done((response) => {
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
  }

  handleCheck(e) {
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
        url: `http://localhost:5000/${endpoint}?searchTerm=${searchTerm}`,
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
    const settings = {
      url: 'http://localhost:5000/chrome',
      method: 'GET',
      timeout: 0,
    };
    $.ajax(settings).done(() => {
      this.setState({
        loggedIn: true,
      });
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
        <CheckBoxes handleCheck={this.handleCheck.bind(this)} />
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
        <div className="videoData">
          <input maxLength="100" onChange={(e) => this.handleChange(e)} id="title" className="titleInput" type="text" placeholder="SEO Optimized Title" />
          <textarea onChange={(e) => this.handleChange(e)} className="tagsTextArea" id="tags" name="tags" rows="4" cols="50" defaultValue="Paste Tags Here" />
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

export default App;
