import React, { useState } from 'react';
import Modal from './modal';

const stop = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

function Project({
  file, path, info, updateTrack, removeTrack,
}) {
  const [done, setComplete] = useState(false);
  const [shown, toggleModal] = useState(false);
  const [close, showClose] = useState(false);
  return (
    <div
      id={file}
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
    >
      {shown
        ? (
          <Modal
            file={file}
            path={path}
            updateTrack={updateTrack}
            toggleModal={toggleModal}
            info={info}
          />
        )
        : (<></>)}
      <div onClick={(e) => {
        if (e.target.className === 'file') toggleModal(!shown);
      }}
      >
        {!done
          ? (
            <div>
              <li className="file">
                {file.beatName}
                {close
                  ? (<button type="button" onClick={() => removeTrack(file)} className="closeX">X</button>)
                  : (<button type="button" onClick={() => removeTrack(file)} className="closeXInvisible">X</button>)}
              </li>
            </div>
          )
          : (
            <li className="file done">
              {file.beatName}
            </li>
          )}
      </div>
    </div>
  );
}

export default Project;
