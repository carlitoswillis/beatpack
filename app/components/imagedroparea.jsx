/* eslint-disable react/jsx-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useEffect } from 'react';

const stop = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

function Image({ img, path, removeImage }) {
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
          <img
            className="listedImage"
            alt="whatever you dropped"
            src={`${path}`}
          />
          {close
            ? (<button type="button" onClick={() => removeImage(img)} className="X">X</button>)
            : (<button type="button" onClick={() => removeImage(img)} className="invisibleX">X</button>)}
        </div>
      </li>
    </>
  );
}

function ImageDropArea({ handleImageDrop, handleImageSelect, info, removeImage}) {
  const [files, setFiles] = useState([]);
  useEffect(() => {
    setFiles(info.imgInfo);
  });
  return (
    <div
      className="imageDropArea"
      id="images"
      onDragOver={stop}
      onDragEnter={stop}
      onDragLeave={stop}
      onKeyPress={(e) => { e.preventDefault(); e.stopPropagation(); handleImageSelect(); }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.className.includes('Area2')) handleImageSelect();
      }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageDrop(e); }}
    >
      <div className="folder dropArea2 grayArea2">
        <h3 className="dropTitle">Images</h3>
        {' '}
        {files && Object.keys(files).length
          ? (
            <ul className="imagesList">
              {Object.keys(files).map((key) => (
                <Image img={files[key]} path={key} removeImage={removeImage} />
              ))}
            </ul>
          )
          : (
            <div className="emptyDropArea2">
              <p> Drop Images/Folders Here </p>
            </div>
          )}
      </div>
    </div>
  );
}

export default ImageDropArea;
