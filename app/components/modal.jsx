import React, { useState } from 'react';

function Modal({
  toggleModal, updateTrack, info, file,
}) {
  const [trackInfo, updateTrackInfo] = useState(info.trackInfo[file.trackPath] || file);
  const inputHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    Object.keys(trackInfo).forEach((key) => {
      if (trackInfo[key] !== '' && trackInfo[key]) {
        updatedTrackInfo[key] = trackInfo[key];
      }
    });
    e.preventDefault();
    e.stopPropagation();
    updateTrack(updatedTrackInfo);
  };
  return (
    <div className="modal" onMouseLeave={(e) => { handleSubmit(e); toggleModal(); }}>
      <p className="modalTitle">{file.beatName}</p>
      <form className="trackInfos">
        <input className="trackInput" onChange={(e) => inputHandler(e)} id="beatName" type="text" placeholder={info.trackInfo[trackInfo.trackPath] ? info.trackInfo[trackInfo.trackPath].beatName || 'Track Title' : trackInfo.beatName || 'Track Title'} />
        <input className="trackInput" onChange={(e) => inputHandler(e)} id="bpm" type="text" placeholder={info.trackInfo[trackInfo.trackPath] ? info.trackInfo[trackInfo.trackPath].bpm || 'BPM' : trackInfo.bpm || 'BPM'} />
        <input className="trackInput" onChange={(e) => inputHandler(e)} id="key" type="text" placeholder={info.trackInfo[trackInfo.trackPath] ? info.trackInfo[trackInfo.trackPath].key || 'Key / Scale' : trackInfo.key || 'Key / Scale'} />
        <button className="trackInput" onClick={(e) => handleSubmit(e)} type="button">Save </button>
      </form>
    </div>
  );
}

export default Modal;
