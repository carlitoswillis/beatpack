import React, { useState } from 'react';
import DropArea from './droparea';
import CheckBoxes from './checkboxes';
import ImageDropArea from './imagedroparea';
import VideoDropArea from './videodroparea';
import InputArea from './inputarea';
import LCD from './lcd';

const path = require('path');
const fs = require('fs');
const electron = require('electron');
const { dialog } = require('electron').remote;

const home = path.join('Applications', 'beatpack.app', 'Contents', 'Resources', 'app');
const ipc = electron.ipcRenderer;

const lcdAlignCenter = (text, size = 16) => {
  text = text.substr(0, size);
  const p = new Array(((size - text.length) / 2) | 0).fill(' ').join('');
  return `${p}${text}${p}`;
};

function App() {
  const [info, updateInfo] = useState(JSON.parse(fs.readFileSync(path.resolve(!process.env._ ? home : '', 'settings', 'info.json'))));

  const loadFiles = (processedData) => {
    const {
      id, files, lib, trackInfo,
    } = processedData;
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      const oldFiles = updatedInfo.files[id];
      updatedInfo.files[id] = [...files];
      const ids = updatedInfo.files[id].map(x => x.index);
      oldFiles.forEach((file) => {
        if (!ids.includes(file.index)) updatedInfo.files[id].push(file);
      });
      updatedInfo.trackInfo = { ...trackInfo, ...updatedInfo.trackInfo };
      updatedInfo.lib = { ...updatedInfo.lib, ...lib };
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
      updatedInfo.imgInfo = { ...imgInfo, ...updatedInfo.imgInfo };
      return updatedInfo;
    });
  };

  const loadVideos = (processedData) => {
    const {
      id, files, vidLib, vidInfo,
    } = processedData;
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo.files[id] = Array.from(new Set([...updatedInfo.files[id], ...files]));
      updatedInfo.vidLib = { ...updatedInfo.vidLib, ...vidLib };
      updatedInfo.vidInfo = { ...vidInfo, ...updatedInfo.vidInfo };
      return updatedInfo;
    });
  };

  const handleSaved = (processedData) => {
    updateInfo({ ...processedData });
  };

  useState(() => {
    ipc.on('processed-files', (event, processedData) => {
      loadFiles(JSON.parse(processedData));
    });
    ipc.on('processed-images', (event, processedData) => {
      loadImages(JSON.parse(processedData));
    });
    ipc.on('processed-videos', (event, processedData) => {
      loadVideos(JSON.parse(processedData));
    });
    ipc.on('saved', (event, processedData) => {
      handleSaved(JSON.parse(processedData));
    });
    ipc.on('reseted', (event, processedData) => {
      handleSaved(JSON.parse(processedData));
    });
    ipc.on('finished-track', (event, processedData) => {
      updateInfo((prevInfo) => {
        const updatedInfo = { ...prevInfo };
        updatedInfo.message = 'finished track!';
        const track = JSON.parse(processedData);
        updatedInfo.lib[track.path][track.index] = track;
        updatedInfo.trackInfo[track.trackPath] = track;
        updatedInfo.done += 1;
        // if (updatedInfo.done < updatedInfo.files.projects.length) {
        updatedInfo.files.projects = Object.values(updatedInfo.lib)
          .reduce((a, b) => a.concat(b), []);
        if (updatedInfo.done === updatedInfo.files.projects.length) {
          updatedInfo.message = 'finished all tracks!';
          updatedInfo.going = false;
          return updatedInfo;
        }
        return updatedInfo;
      });
    });
    ipc.on('starting-track', (event, track) => {
      updateInfo((prevInfo) => {
        const updatedInfo = { ...prevInfo, track };
        return updatedInfo;
      });
    });
    ipc.on('finished-track-processing', (event, message) => {
      updateInfo((prevInfo) => {
        const updatedInfo = { ...prevInfo, message: `finished ${message}` };
        return updatedInfo;
      });
    });
    ipc.on('working', (event, message) => {
      updateInfo((prevInfo) => {
        const updatedInfo = { ...prevInfo, message: `${message}` };
        return updatedInfo;
      });
    });
    ipc.on('task-finished', (event, message) => {
      updateInfo((prevInfo) => {
        const updatedInfo = { ...prevInfo, message: `finished ${message}` };
        return updatedInfo;
      });
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

  const updateTrack = ({ updatedTrackInfo, file }) => {
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo.trackInfo[updatedTrackInfo.trackPath] = {
        ...updatedInfo
          .trackInfo[updatedTrackInfo.trackPath],
        ...updatedTrackInfo,
      };
      updatedInfo.lib[file.path][file.index] = updatedTrackInfo;
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
      updatedInfo.files.projects = Object.values(updatedInfo.trackInfo).reduce((a, b) => a.concat(b), []);
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
    e.preventDefault();
    e.stopPropagation();
    const updatedInfo = { ...info };
    updatedInfo[e.target.id] = e.target.value;
    updateInfo(updatedInfo);
  };

  const removeImage = (img) => {
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      delete updatedInfo.imgInfo[img.imgPath];
      updatedInfo.imageLib[img.path].splice([img.index]);
      updatedInfo.imageLib[img.path].map((x, index) => {
        x.index = index;
        return x;
      });
      updatedInfo.files.images = Object.values(updatedInfo.imgInfo)
        .reduce((a, b) => a.concat(b), []);
      return updatedInfo;
    });
  };

  const buttonHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const infoToProcess = { ...info };
    if (e.target.id === 'start') {
      infoToProcess.going = true;
      updateInfo(infoToProcess);
    }
    ipc.send(e.target.id, JSON.stringify(infoToProcess));
  };

  const handleVidDrop = (e) => {
    const videoPaths = Array.from(e.dataTransfer.files).map((file) => file.path);
    ipc.send('process-video-selection', JSON.stringify({ id: 'videos', videoPaths }));
  };
  const handleVidSelect = (e) => {
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
      .then((result) => result)
      .then((selection) => {
        if (!selection.canceled) {
          ipc.send('process-video-selection', JSON.stringify({ id: 'videos', videoPaths: selection.filePaths }));
        }
      });
  };
  const removeVid = (vid) => {
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      delete updatedInfo.vidInfo[vid.videoPath];
      updatedInfo.vidLib[vid.path].splice([vid.index]);
      updatedInfo.vidLib[vid.path].map((x, index) => {
        x.index = index;
        return x;
      });
      updatedInfo.files.videos = Object.values(updatedInfo.vidInfo)
        .reduce((a, b) => a.concat(b), []);
      return updatedInfo;
    });
  };

  return (
    <div onClick={() => console.log(info)}>
      <div className="titleBG">
        {/* <h1 className="beatpackTitle">Beatpack</h1> */}
        <CheckBoxes handleCheck={handleCheck} info={info} />
        <button onClick={(e) => buttonHandler(e)} className="resetButton" id="reset" type="button">Reset</button>
        <button onClick={(e) => buttonHandler(e)} className="saveButton" id="save" type="button">Save</button>
        <button onClick={(e) => buttonHandler(e)} className="startButton" id="start" type="button">Start</button>
      </div>
      <div className="container">
        <DropArea handleDrop={handleDrop} updateTrack={updateTrack} removeFolder={removeFolder} removeTrack={removeTrack} selectFiles={selectFiles} id="projects" title="Projects" info={info} />
        <ImageDropArea
          handleImageDrop={handleImageDrop}
          handleImageSelect={handleImageSelect}
          info={info}
          removeImage={removeImage}
        />
        <VideoDropArea
          handleVidDrop={handleVidDrop}
          handleVidSelect={handleVidSelect}
          info={info}
          removeVid={removeVid}
        />
        <InputArea info={info} inputHandler={inputHandler} />
      </div>
      {info.going
        ? (
          <div className="lcdHolder">
            {' '}
            <LCD width="100%" line1={`${info.track}`} line2={lcdAlignCenter(`${info.message}`)} backlit />
          </div>
        )
        : (<></>)}
    </div>
  );
}

export default App;
