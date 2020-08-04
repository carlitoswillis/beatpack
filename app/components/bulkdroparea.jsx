/* eslint-disable react/prop-types */
import React from 'react';

// const fs = require('fs');

const BulkDropArea = ({
  path, data, handleDrop, handleDragOver, handleDragEnter, handleDragLeave, info,
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
            {info[`${path}Files`][0].name}
          </p>
          <p className="dropLabel">
            loaded
          </p>
          {/*
          <div className="bulkFiles">
            {Array.from(fs.readdirSync(data))
              .filter((name) => name[0] !== '.')
              .map((file) => (
                <p key={file} className="dropLabel">
                  {file}
                </p>
              ))}
          </div>
              */}
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

export default BulkDropArea;
