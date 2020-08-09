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

const modalStyle = {
  left: location ? location.x : 0,
  top: location ? location.y : 0,
};

function Modal({
  toggleModal, updateTrack, info, file, path,
}) {
  const [trackInfo, updateTrackInfo] = useState(info.trackInfo[path] || { path, file, trackPath: `${path}/${file}` });
  const inputHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(e.target.value, e.target.id, 'old Info: ', trackInfo);
    const { id } = e.target;
    const { value } = e.target;
    if (value !== '') {
      updateTrackInfo((oldInfo) => {
        const updatedTrackInfo = { ...oldInfo };
        updatedTrackInfo[id] = value;
        return updatedTrackInfo;
      });
    }
  };
  const handleSubmit = (e) => {
    const updatedTrackInfo = {};
    Object.keys(trackInfo).forEach(key => {
      if (trackInfo[key] !== '' && trackInfo[key]) {
        updatedTrackInfo[key] = trackInfo[key];
      }
    });
    e.preventDefault();
    e.stopPropagation();
    updateTrack(updatedTrackInfo);
  };
  return (
    <div className="modal" style={modalStyle} onMouseLeave={(e) => { handleSubmit(e); toggleModal(); }}>
      <h3 className="modalTitle">{file}</h3>
      <form className="trackInfos">
        <input onChange={(e) => inputHandler(e)} id="beatName" type="text" placeholder={info.trackInfo[trackInfo.trackPath] ? info.trackInfo[trackInfo.trackPath].beatName || 'Track Title' : trackInfo.beatName || 'Track Title'} />
        <input onChange={(e) => inputHandler(e)} id="bpm" type="text" placeholder={info.trackInfo[trackInfo.trackPath] ? info.trackInfo[trackInfo.trackPath].bpm || 'BPM' : trackInfo.bpm || 'BPM'} />
        <input onChange={(e) => inputHandler(e)} id="key" type="text" placeholder={info.trackInfo[trackInfo.trackPath] ? info.trackInfo[trackInfo.trackPath].key || 'Key / Scale' : trackInfo.key || 'Key / Scale'} />
        <button onClick={(e) => handleSubmit(e)} type="button">Submit </button>
      </form>
    </div>
  );
}

function Project({
  file, path, info, updateTrack,
}) {
  const [done, setComplete] = useState(false);
  const [shown, toggleModal] = useState(false);
  return (
    <div
      id={file}
    >
      {shown
        ? (
          <Modal
            // onMouseLeave={() => toggleModal(false)}
            file={file}
            path={path}
            updateTrack={updateTrack}
            toggleModal={toggleModal}
            info={info}
          />
        )
        : (<></>)}
      <div onClick={() => {
        toggleModal(!shown);
        console.log('clicked a track name');
      }}
      >
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
    </div>
  );
}

function DropArea(props) {
  const {
    handleDrop, selectFiles, id, title, info, updateTrack,
  } = props;
  const [files, setFiles] = useState([]);
  useEffect(() => {
    setFiles(info.lib);
  });
  return (
    <div
      className="folder dropArea grayArea"
      id={id}
      onClick={(e) => {
        if (e.target.id === id) {
          selectFiles(e);
        }
      }}
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
        { files && Object.entries(files).length
          ? (
            Object.entries(files).map((folder) => (
              <li>
                <div className="droppedFolderTitleBG">
                  <p className="droppedFolderTitle">{folder[0].split('/').pop()}</p>
                </div>
                {folder[1]
                  .map((file) => (
                    <Project updateTrack={updateTrack} path={folder[0]} file={file} info={info} />
                  ))}
              </li>
            )))
          : (<p />
          ) }
      </ul>
    </div>
  );
}

export default DropArea;
