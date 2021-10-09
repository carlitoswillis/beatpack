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
  const [removingVid, setRemovingVid] = useState(false);
  const [mouseIsDown, setMouseIsDown] = useState(false);

  const loadFiles = (processedData) => {
    const {
      id, files, lib, trackInfo,
    } = processedData;
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      const oldFiles = updatedInfo.files[id];
      updatedInfo.files[id] = [...files];
      const ids = updatedInfo.files[id].map((x) => x.index);
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
      for (const folder of Object.keys(updatedInfo.vidLib)) {
        if (vidLib[folder]) {
          for (const vid of updatedInfo.vidLib[folder]) {
            if (!vidLib[folder].includes(vid)) {
              vidLib[folder].push(vid);
            }
          }
        }
      }
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
        updatedInfo.files.projects = Object.values(updatedInfo.lib)
          .reduce((a, b) => a.concat(b), []);
        if (updatedInfo.done === updatedInfo.files.projects.length) {
          console.log('should be done');
          updatedInfo.message = 'finished all tracks!';
          updatedInfo.done = 0;
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
    ipc.send('process-file-selection', JSON.stringify({ id: 'projects', filePaths, producer: info.producer }));
  };

  const selectFiles = () => {
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
      .then((result) => result)
      .then((selection) => {
        if (!selection.canceled) {
          ipc.send('process-file-selection', JSON.stringify({ id: 'projects', filePaths: selection.filePaths, producer: info.producer }));
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

  const getDependentsForTask = (task) => {
    const dependents = {
      video: ['square', 'wide', 'no logo', 'logo', 'soundwave'],
      art: ['video', 'upload'],
      upload: ['video'],
      all: ['mp3', 'art', 'video', 'zip', 'cleanUp', 'upload'],
    };
    let queue = [task];
    const tasks = [];
    const queued = new Set(queue);
    while (queue.length) {
      const [currTask, ...restOfQueue] = queue;
      const currTaskDependents = dependents[currTask] || [];
      dependents[currTask] = [];
      if (currTaskDependents.length) {
        for (let i = 0; i < currTaskDependents.length; i += 1) {
          const dependent = currTaskDependents[i];
          if (!queued.has(dependent)) {
            restOfQueue.push(dependent);
            queued.add(dependent);
          }
        }
        restOfQueue.push(currTask);
      } else {
        tasks.push(currTask);
      }
      queue = restOfQueue;
    }
    return tasks;
  };

  const getDependenciesForTask = (task) => {
    const dependencies = {
      wide: ['video'],
      square: ['video'],
      soundwave: ['video'],
      'no logo': ['video'],
      logo: ['video'],
      video: ['art'],
      all: ['mp3', 'art', 'video', 'zip', 'cleanUp', 'upload'],
    };
    let queue = [task];
    const tasksOrderedByDependencies = [];
    const queued = new Set([task]);
    while (queue.length) {
      const [currTask, ...restOfQueue] = queue;
      const currTaskDependencies = dependencies[currTask] || [];
      dependencies[currTask] = [];
      if (currTaskDependencies.length) {
        for (let i = 0; i < currTaskDependencies.length; i += 1) {
          const dependency = currTaskDependencies[i];
          if (!queued.has(dependency)) {
            restOfQueue.push(dependency);
            queued.add(dependency);
          }
        }
        restOfQueue.push(currTask);
      } else {
        tasksOrderedByDependencies.push(currTask);
      }
      queue = restOfQueue;
    }
    return tasksOrderedByDependencies;
  };

  const markAllRelated = (updatedInfo, id, bool) => {
    const tasks = bool ? getDependenciesForTask(id) : [id, ...getDependentsForTask(id)];
    for (let i = 0; i < tasks.length; i += 1) {
      updatedInfo[tasks[i]] = bool;
    }
  };

  const handleCheck = (id) => {
    const updatedInfo = { ...info };
    markAllRelated(updatedInfo, id, !updatedInfo[id]);
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
  const inputHandler = (e, value) => {
    e.preventDefault();
    e.stopPropagation();
    const updatedInfo = { ...info };
    updatedInfo[e.target.id] = value || e.target.value;
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
    const { id } = e.target;
    if (!info.going) {
      const infoToProcess = { ...info };
      infoToProcess.files.projects = infoToProcess.files.projects.map((project, index) => {
        infoToProcess.files.projects[index].done = false;
        return infoToProcess.files.projects[index];
      });
      infoToProcess.going = id === 'start';
      updateInfo(() => {
        ipc.send(id, JSON.stringify(infoToProcess));
        return infoToProcess;
      });
    }
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
    if (!removingVid) {
      setRemovingVid(true);
      updateInfo((prevInfo) => {
        const updatedInfo = { ...prevInfo };
        delete updatedInfo.vidInfo[vid.videoPath];
        updatedInfo.vidLib[vid.path].splice(vid.index, 1);
        updatedInfo.vidLib[vid.path].forEach((filePath, index) => {
          updatedInfo.vidInfo[filePath].index = index;
        });
        updatedInfo.files.videos = Object.values(updatedInfo.vidLib)
          .reduce((a, b) => a.concat(b), []);
        setRemovingVid(false);
        return updatedInfo;
      });
    }
  };

  return (
    <div onClick={() => console.log(info)}>
      <div className="titleBG">
        {/* <h1 className="beatpackTitle">Beatpack</h1> */}
        <CheckBoxes
          setMouseIsDown={setMouseIsDown}
          mouseIsDown={mouseIsDown}
          handleCheck={handleCheck}
          info={info}
        />
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
          handleCheck={handleCheck}
          setMouseIsDown={setMouseIsDown}
          mouseIsDown={mouseIsDown}
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
