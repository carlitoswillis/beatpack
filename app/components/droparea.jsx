/* eslint-disable react/jsx-key */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import Project from './project';

const stop = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const filterFrontElements = (e, id, cb) => {
  if (e.target.id === id || !['modal', 'modalTitle', 'file', 'filedone', 'trackInput', 'closeX', 'closeXBeatFolder', 'droppedFolderTitle', 'file missingData'].includes(e.target.className)) {
    cb(e);
  }
};

function DropArea(props) {
  const {
    handleDrop, selectFiles, id, title, info, updateTrack, removeTrack, removeFolder,
  } = props;
  const [files, setFiles] = useState([]);
  const [close, showClose] = useState(false);
  useEffect(() => {
    setFiles(info.lib);
  }, [info]);
  return (
    <div
      className="folder dropArea grayArea"
      id={id}
      onClick={(e) => {
        filterFrontElements(e, id, selectFiles);
      }}
      onDrop={(e) => {
        stop(e);
        filterFrontElements(e, id, handleDrop);
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
                  <div
                    onMouseOver={(e) => {
                      stop(e);
                      showClose(true);
                    }}
                    onMouseLeave={(e) => {
                      stop(e);
                      showClose(false);
                    }}
                    onFocus={(e) => {
                      stop(e);
                      showClose(true);
                    }}
                    className="droppedFolderTitle"
                  >
                    {folder[0].split('/').pop()}
                    {close
                      ? (<button type="button" onClick={() => removeFolder(folder)} className="closeXBeatFolder">X</button>)
                      : (<button type="button" onClick={() => removeFolder(folder)} className="closeXInvisibleBeatFolder">X</button>)}
                  </div>
                </div>
                {folder[1]
                  .map((file) => (
                    <Project removeTrack={removeTrack} updateTrack={updateTrack} path={folder[0]} file={file} info={info} />
                  ))}
              </li>
            )))
          : (<p className="emptyDropArea"> Drop Projects/Folders Here </p>
          ) }
      </ul>
    </div>
  );
}

export default DropArea;
