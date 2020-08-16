/* eslint-disable react/jsx-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useEffect } from 'react';

const stop = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

function Video({
  vid, path, removeVid, index,
}) {
  const [close, showClose] = useState(false);
  return (
    <>
      <li className="imageLI">
        <div
          onFocus={(e) => {
            stop(e);
            showClose(true);
          }}
          onMouseOver={(e) => {
            stop(e);
            showClose(true);
          }}
          onMouseLeave={(e) => {
            stop(e);
            showClose(false);
          }}
        >
          {index < 3
            ? (
              <video className="listedImage" alt="whatever you dropped" src={`${path}`} controls muted autoPlay loop />
            )
            : (
              <video className="listedImage" alt="whatever you dropped" src={`${path}`} controls muted loop />
            )}
          {close
            ? (<button type="button" onClick={() => removeVid(vid)} className="X">X</button>)
            : (<button type="button" onClick={() => removeVid(vid)} className="invisibleX">X</button>)}
        </div>
      </li>
    </>
  );
}

function VideoDropArea({
  handleVidDrop, handleVidSelect, info, removeVid,
}) {
  const [files, setFiles] = useState([]);
  useEffect(() => {
    setFiles(info.vidInfo);
  });
  return (
    <div
      className="imageDropArea"
      id="videos"
      onDragOver={stop}
      onDragEnter={stop}
      onDragLeave={stop}
      onKeyPress={(e) => { e.preventDefault(); e.stopPropagation(); handleVidSelect(); }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.className.includes('Area2')) handleVidSelect();
      }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleVidDrop(e); }}
    >
      <div className="folder dropArea2 grayArea2">
        <h3 className="dropTitle">Videos</h3>
        {' '}
        {files && Object.keys(files).length
          ? (
            <ul className="imagesList">
              {Object.keys(files).map((key, index) => (
                <Video index={index} vid={files[key]} path={key} removeVid={removeVid} />
              ))}
            </ul>
          )
          : (
            <div className="emptyDropArea2">
              <p> Drop Videos/Folders Here </p>
            </div>
          )}
      </div>
    </div>
  );
}

export default VideoDropArea;
