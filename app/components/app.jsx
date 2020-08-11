import React, { useState } from 'react';
import DropArea from './droparea';
import CheckBoxes from './checkboxes';
import ImageDropArea from './imagedroparea';
import InputArea from './inputarea';

const { dialog } = require('electron').remote;
const electron = require('electron');

const ipc = electron.ipcRenderer;

function App({ data }) {
  const [info, updateInfo] = useState(data);

  const loadFiles = (processedData) => {
    const {
      id, files, lib, trackInfo,
    } = processedData;
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo.files[id] = Array.from(new Set([...updatedInfo.files[id], ...files]));
      updatedInfo.lib = { ...updatedInfo.lib, ...lib };
      return updatedInfo;
    });
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo.trackInfo = { ...trackInfo, ...updatedInfo.trackInfo };
      return updatedInfo;
    });
  };

  const loadImages = (processedData) => {
    const {
      id, files, imageLib, imgInfo,
    } = processedData;
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo.files[id] = Array.from(new Set([...updatedInfo.files[id], ...files]));
      updatedInfo.imageLib = { ...updatedInfo.imageLib, ...imageLib };
      return updatedInfo;
    });
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo.imgInfo = { ...imgInfo, ...updatedInfo.imgInfo };
      return updatedInfo;
    });
  };

  useState(() => {
    ipc.on('processed-files', (event, processedData) => {
      loadFiles(JSON.parse(processedData));
    });
    ipc.on('processed-images', (event, processedData) => {
      loadImages(JSON.parse(processedData));
    });
  });

  const handleDrop = (e) => {
    const filePaths = Array.from(e.dataTransfer.files).map((file) => file.path);
    ipc.send('process-file-selection', JSON.stringify({ id: 'projects', filePaths }));
  };

  const selectFiles = () => {
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
      .then((result) => result)
      .then((selection) => {
        if (!selection.canceled) {
          ipc.send('process-file-selection', JSON.stringify({ id: 'projects', filePaths: selection.filePaths }));
        }
      });
  };

  const updateTrack = (update) => {
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo.trackInfo[update.trackPath] = {
        ...updatedInfo
          .trackInfo[update.trackPath],
        ...update,
      };
      return updatedInfo;
    });
  };

  const removeTrack = (track) => {
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      delete updatedInfo.trackInfo[track.trackPath];
      updatedInfo.lib[track.path].splice([track.index], 1);
      updatedInfo.lib[track.path].map((x, index) => {
        x.index = index;
        return x;
      });
      updatedInfo.files.projects = Object.values(updatedInfo.lib).reduce((a, b) => a.concat(b), []);
      if (!updatedInfo.lib[track.path].length) delete updatedInfo.lib[track.path];
      return updatedInfo;
    });
  };

  const removeFolder = (folder) => {
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      Object.keys(updatedInfo.trackInfo).forEach((key) => {
        if (key.includes(folder[0])) {
          delete updatedInfo.trackInfo[key];
        }
      });
      delete updatedInfo.lib[folder[0]];
      updatedInfo.files.projects = Object.values(updatedInfo.lib).reduce((a, b) => a.concat(b), []);
      return updatedInfo;
    });
  };

  const handleCheck = (e) => {
    const updatedInfo = { ...info };
    updatedInfo[e.target.id] = !updatedInfo[e.target.id];
    if (e.target.id === 'all') {
      ['mp4', 'mp3', 'zip', 'art', 'upload'].forEach((a) => {
        updatedInfo[a] = updatedInfo[e.target.id];
      });
    }
    updateInfo(updatedInfo);
  };
  const handleImageDrop = (e) => {
    const imagePaths = Array.from(e.dataTransfer.files).map((file) => file.path);
    ipc.send('process-image-selection', JSON.stringify({ id: 'images', imagePaths }));
  };
  const handleImageSelect = (e) => {
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
      .then((result) => result)
      .then((selection) => {
        if (!selection.canceled) {
          ipc.send('process-image-selection', JSON.stringify({ id: 'images', imagePaths: selection.filePaths }));
        }
      });
  };
  const inputHandler = (e) => {
    const updatedInfo = { ...info };
    updatedInfo[e.target.id] = e.target.value;
    updateInfo(updatedInfo);
  };

  return (
    <div onClick={() => console.log(info)}>
      <div className="titleBG">
        {/* <h1 className="beatpackTitle">Beatpack</h1> */}
        <CheckBoxes handleCheck={handleCheck} info={info} />
        <button className="startButton" type="button"> Start </button>
      </div>
      <div className="container">
        <DropArea handleDrop={handleDrop} updateTrack={updateTrack} removeFolder={removeFolder} removeTrack={removeTrack} selectFiles={selectFiles} id="projects" title="Projects" info={info} />
        <ImageDropArea
          handleImageDrop={handleImageDrop}
          handleImageSelect={handleImageSelect}
          info={info}
        />
        <InputArea info={info} inputHandler={inputHandler} />
      </div>
    </div>
  );
}

export default App;
