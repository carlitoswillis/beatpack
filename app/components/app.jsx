import React, { useState } from 'react';
import DropArea from './droparea';

const { dialog } = require('electron').remote;
const electron = require('electron');

const ipc = electron.ipcRenderer;

function App({ data }) {
  const [info, updateInfo] = useState(data);

  const loadFiles = (processedData) => {
    const { id, files, lib } = processedData;
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo.files[id] = Array.from(new Set([...updatedInfo.files[id], ...files]));
      updatedInfo.lib = { ...updatedInfo.lib, ...lib };
      console.log(updatedInfo);
      return updatedInfo;
    });
  };

  useState(() => {
    ipc.on('processed-files', (event, processedData) => {
      loadFiles(JSON.parse(processedData));
    });
  });

  const handleDrop = (e) => {
    const filePaths = Array.from(e.dataTransfer.files).map((file) => file.path);
    const { id } = e.target;
    if (id in info.files) {
      ipc.send('process-file-selection', JSON.stringify({ id, filePaths }));
    }
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
  return (
    <div onClick={(() => console.log(info))}>
      <h1>Beatpack</h1>
      <DropArea handleDrop={handleDrop} updateTrack={updateTrack} selectFiles={selectFiles} id="projects" title="Projects" info={info} />
    </div>
  );
}

export default App;
