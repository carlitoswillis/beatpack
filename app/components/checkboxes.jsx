import React from 'react';

const Checkbox = ({ id, name, info, handleCheck }) => (
  <div className="options">
    {info[id]
      ? (<button onClick={(e) => handleCheck(e)} className="features selectedFeature" defaultChecked id={id} type="button">{name}</button>)
      : (<button onClick={(e) => handleCheck(e)} className="features notSelectedFeature" defaultChecked id={id} type="button">{name}</button>)}
  </div>
);

const CheckBoxes = ({ handleCheck, info }) => (
  <div className="checkboxes">
    <Checkbox handleCheck={handleCheck} id="mp3" name="mp3" info={info} />
    <Checkbox handleCheck={handleCheck} id="zip" name="zip" info={info} />
    <Checkbox handleCheck={handleCheck} id="art" name="art" info={info} />
    <Checkbox handleCheck={handleCheck} id="mp4" name="mp4" info={info} />
    <Checkbox handleCheck={handleCheck} id="upload" name="upload" info={info} />
    <Checkbox handleCheck={handleCheck} id="cleanUp" name="delete" info={info} />
    <Checkbox handleCheck={handleCheck} id="all" name="all" info={info} />
  </div>
);

export default CheckBoxes;
