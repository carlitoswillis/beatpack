import React from 'react';

const Checkbox = ({ id, info, handleCheck }) => (
  <div className="options">
    {info[id]
      ? (<button onClick={(e) => handleCheck(e)} className="features selectedFeature" defaultChecked id={id} type="button">{id}</button>)
      : (<button onClick={(e) => handleCheck(e)} className="features notSelectedFeature" defaultChecked id={id} type="button">{id}</button>)}
  </div>
);

const CheckBoxes = ({ handleCheck, info }) => (
  <div className="checkboxes">
    <Checkbox handleCheck={handleCheck} id="mp3" info={info} />
    <Checkbox handleCheck={handleCheck} id="zip" info={info} />
    <Checkbox handleCheck={handleCheck} id="art" info={info} />
    <Checkbox handleCheck={handleCheck} id="mp4" info={info} />
    <Checkbox handleCheck={handleCheck} id="upload" info={info} />
    <Checkbox handleCheck={handleCheck} id="delete" info={info} />
    <Checkbox handleCheck={handleCheck} id="all" info={info} />
  </div>
);

export default CheckBoxes;
