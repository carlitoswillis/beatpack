import React, { useState } from 'react';
import DropArea from './droparea';

const { dialog } = require('electron').remote;
const electron = require('electron');

const ipc = electron.ipcRenderer;

function App({ data }) {
  const [info, updateInfo] = useState(data);

  const loadFiles = (processedData) => {
    const { id, files } = processedData;
    updateInfo((prevInfo) => {
      const updatedInfo = { ...prevInfo };
      updatedInfo[id] = files;
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
    ipc.send('process-file-selection', JSON.stringify({ id, filePaths }));
  };

  const selectFiles = (e) => {
    const { id } = e.target;
    dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
      .then((result) => result)
      .then((selection) => {
        if (!selection.canceled) {
          ipc.send('process-file-selection', JSON.stringify({ id, filePaths: selection.filePaths }));
        }
      });
  };
  return (
    <div>
      <h1>Beatpack</h1>
      <DropArea handleDrop={handleDrop} selectFiles={selectFiles} id="folderPath" title="Projects" info={info} />
      <DropArea handleDrop={handleDrop} selectFiles={selectFiles} id="imagePath" title="Images" info={info} />
    </div>
  );
}

export default App;
