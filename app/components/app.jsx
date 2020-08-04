/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { Component } from 'react';
import DropArea from './droparea';
import BulkDropArea from './bulkdroparea';
import CheckBoxes from './checkboxes';

const $ = require('jquery');

class App extends Component {
  constructor(props) {
    super(props);
    const { testInfo } = props;
    const defaultInfo = testInfo || {
      single: true, mp3: true, mp4: true, zip: true, upload: true, imagePathFiles: [], folderPathFiles: [], date: new Date(),
    };

    const info = { ...defaultInfo };
    this.state = { info };
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
    updatedInfo[`${e.target.id}Files`] = e.dataTransfer.files;
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
    const state = { info: updatedInfo };
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
      info, loggedIn,
    } = this.state;
    return (
      <div>
        <h1>BeatPack</h1>
        <h3 id="mode">{info.single ? 'Single Mode' : 'Bulk Mode'}</h3>
        {info.single
          ? (
            <div className="container">
              <DropArea path="folderPath" info={info} data={info.folderPath} handleDrop={this.handleDrop.bind(this)} handleDragOver={this.handleDragOver.bind(this)} handleDragEnter={this.handleDragEnter.bind(this)} handleDragLeave={this.handleDragLeave.bind(this)} />
              <DropArea path="imagePath" info={info} data={info.imagePath} handleDrop={this.handleDrop.bind(this)} handleDragOver={this.handleDragOver.bind(this)} handleDragEnter={this.handleDragEnter.bind(this)} handleDragLeave={this.handleDragLeave.bind(this)} />
            </div>
          )
          : (
            <div className="container">
              <BulkDropArea path="folderPath" files={Array.prototype.slice.call(info.folderPathFiles)} data={info.folderPath} info={info} handleDrop={this.handleDrop.bind(this)} handleDragOver={this.handleDragOver.bind(this)} handleDragEnter={this.handleDragEnter.bind(this)} handleDragLeave={this.handleDragLeave.bind(this)} />
              <BulkDropArea path="imagePath" info={info} files={Array.prototype.slice.call(info.imagePathFiles)} data={info.imagePath} handleDrop={this.handleDrop.bind(this)} handleDragOver={this.handleDragOver.bind(this)} handleDragEnter={this.handleDragEnter.bind(this)} handleDragLeave={this.handleDragLeave.bind(this)} />
            </div>
          )}
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
        {/* {loggedIn
          ? <div />
          : (
            <div onClick={() => { this.handleLogin(); }} onKeyDown={() => { this.handleLogin(); }} className="buttons ytbtn" id="youtubeLogin">
              <p>
                YouTube Login
              </p>
            </div>
          )} */}
      </div>
    );
  }
}

export default App;
