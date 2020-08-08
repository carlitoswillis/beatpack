/* eslint-disable max-len */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { Component } from 'react';
import DropArea from './droparea';
import CheckBoxes from './checkboxes';

const $ = require('jquery');

const { dialog } = require('electron').remote;
const electron = require('electron');

const ipc = electron.ipcRenderer;

class App extends Component {
  constructor(props) {
    super(props);
    const { testInfo } = props;
    const defaultInfo = testInfo || {
      // eslint-disable-next-line max-len
      single: false, mp3: true, makeCover: true, mp4: true, zip: true, upload: true, imageFiles: [], files: [], date: new Date(), startDate: '2020-10-31', startTime: '9:29', outputPath: '/Users/carlitoswillis/Google Drive (carlitoswillis@berkeley.edu)/Track Outs/processed',
    };

    this.state = { info: defaultInfo };
  }

  componentDidMount() {
    ipc.on('processed-files', (event, data) => {
      const { id, files } = JSON.parse(data);
      const { info } = this.state;
      const updatedInfo = { ...info };
      updatedInfo[id] = files;
      this.setState({ info: updatedInfo });
    });
  }

  handleStart() {
    const { info } = this.state;
    const ready = info.folderPath && info.imagePath && info.type && info.tags && info.title;
    if (ready) {
      console.log('ready');
      ipc.send('start-processing', JSON.stringify(info));
      /*
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
      */
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

  selectFiles(e) {
    const { id } = e.target;
    const { info } = this.state;
    const updatedInfo = { ...info };
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
      .then((result) => result)
      .then((selection) => {
        if (!selection.canceled) {
          ipc.send('process-file-selection', JSON.stringify({ id, filePaths: selection.filePaths }));
          updatedInfo[id] = selection.filePaths;
          this.setState({ info: updatedInfo });
        }
      });
  }

  render() {
    const {
      // eslint-disable-next-line no-unused-vars
      info, loggedIn,
    } = this.state;
    return (
      <div>
        <h1>BeatPack</h1>
        <h3 id="mode">{info.single ? 'Single Mode' : 'Bulk Mode'}</h3>
        <div className="container">
          <DropArea path="folderPath" title="Folders" id="files" files={info.files} selectFiles={this.selectFiles.bind(this)} info={info} data={info.folderPath} handleDrop={this.handleDrop.bind(this)} handleDragOver={this.handleDragOver.bind(this)} handleDragEnter={this.handleDragEnter.bind(this)} handleDragLeave={this.handleDragLeave.bind(this)} />
          <DropArea path="imagePath" title="Pictures" id="imageFiles" files={info.imageFiles} selectFiles={this.selectFiles.bind(this)} info={info} data={info.imagePath} handleDrop={this.handleDrop.bind(this)} handleDragOver={this.handleDragOver.bind(this)} handleDragEnter={this.handleDragEnter.bind(this)} handleDragLeave={this.handleDragLeave.bind(this)} />
        </div>
        <CheckBoxes handleCheck={this.handleCheck.bind(this)} />
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
          <input
            onChange={(e) => this.handleChange(e)}
            type="date"
            id="startDate"
            name="startDate"
          />
          <input
            onChange={(e) => this.handleChange(e)}
            type="time"
            id="startTime"
            name="startTime"
            min="09:00"
            max="20:00"
          />
          <input onChange={(e) => this.handleChange(e)} id="type" className="titleInput" type="text" placeholder="type beat" />
          <input maxLength="100" onChange={(e) => this.handleChange(e)} id="title" className="titleInput" type="text" placeholder="SEO Optimized Title" />
          <textarea onChange={(e) => this.handleChange(e)} className="tagsTextArea" id="tags" name="tags" rows="4" cols="50" defaultValue="Paste Tags Here" />
          <textarea onChange={(e) => this.handleChange(e)} className="tagsTextArea" id="description" name="description" rows="4" cols="50" defaultValue="Further Description About The Beats, The Related Artists, Etc" />
        </div>
        {/* {loggedIn
          ? <div />
          : (
            // eslint-disable-next-line max-len
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
