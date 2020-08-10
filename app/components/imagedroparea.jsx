/* eslint-disable react/jsx-key */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useEffect } from 'react';

const stop = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

function ImageDropArea({ handleImageDrop, handleImageSelect, info }) {
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
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleImageSelect(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageDrop(e); }}
    >
      <div className="folder dropArea2 grayArea2">
        <h3 className="dropTitle">Images</h3>
        {' '}
        {files && Object.keys(files).length
          ? (
            <ul className="imagesList">
              {Object.keys(files).map((img) => (<li className="imageLI"><img className="listedImage" alt="whatever you dropped" src={`${img}`}/></li>))}
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

