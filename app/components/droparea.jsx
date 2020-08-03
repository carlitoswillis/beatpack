/* eslint-disable react/prop-types */
import React from 'react';

const DropArea = ({
  path, loaded, name, handleDrop, handleDragOver, handleDragEnter, handleDragLeave,
}) => (
  <div>
    {loaded
      ? (
        <div
          className="dropArea grayArea"
          id={path}
          onDrop={(e) => handleDrop(e)}
          onDragOver={(e) => handleDragOver(e)}
          onDragEnter={(e) => handleDragEnter(e)}
          onDragLeave={(e) => handleDragLeave(e)}
        >
          <p className="dropLabel">
            {name}
            {' '}
            loaded here
          </p>
        </div>
      )
      : (
        <div
          className="dropArea"
          id={path}
          onDrop={(e) => handleDrop(e)}
          onDragOver={(e) => handleDragOver(e)}
          onDragEnter={(e) => handleDragEnter(e)}
          onDragLeave={(e) => handleDragLeave(e)}
        >
          <p className="dropLabel">Drop Folder Here</p>
        </div>
      )}
  </div>
);

export default DropArea;
