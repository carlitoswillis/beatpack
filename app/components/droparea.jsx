/* eslint-disable react/jsx-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';

// const { dialog } = require('electron').remote;
// const electron = require('electron');

// const ipc = electron.ipcRenderer;

const stop = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

function Project({ file }) {
  const [done, setComplete] = useState(false);
  // useEffect(() => {
  //   ipc.on('processed-files', (event, processedData) => {
  //     loadFiles(JSON.parse(processedData));
  //   });
  // });
  return (
    <div>
      {done
        ? (
          <li className="file done">
            {file}
          </li>
        )
        : (
          <li className="file">
            {file}
          </li>
        )}
    </div>
  );
}

function DropArea(props) {
  const {
    handleDrop, selectFiles, id, title, info,
  } = props;
  const [files, setFiles] = useState([]);
  useEffect(() => {
    setFiles(info[id]);
  });
  return (
    <div
      className="folder dropArea grayArea"
      id={id}
      onClick={(e) => { selectFiles(e); }}
      onDrop={(e) => {
        stop(e);
        handleDrop(e);
      }}
      onDragOver={stop}
      onDragEnter={stop}
      onDragLeave={stop}
    >
      <h3 className="dropTitle">{title}</h3>
      {' '}
      <ul className="files">
        { files && files.length
          ? (
            files.map((file) => (
              <Project file={file} />
            )))
          : (<p />
          ) }
      </ul>
    </div>
  );
}

export default DropArea;
