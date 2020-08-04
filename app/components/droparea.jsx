/* eslint-disable react/prop-types */
import React from 'react';

const DropArea = ({
  path, data, info, handleDrop, handleDragOver, handleDragEnter, handleDragLeave,
}) => (
  <div>
    {data
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
            {info[`${path}Files`][0] ? info[`${path}Files`][0].name : data}
          </p>
          <p className="dropLabel">
            loaded
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
