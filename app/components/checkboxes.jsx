import React from 'react';

const CheckBoxes = ({ handleCheck }) => (
  <div className="checkboxes">
    <div className="options">
      <p className="checkboxLabel">mp3ify</p>
      <input onClick={(e) => handleCheck(e)} className="features" defaultChecked id="mp3" type="checkbox" />
    </div>
    <div className="options">
      <p className="checkboxLabel">zip</p>
      <input onClick={(e) => handleCheck(e)} className="features" defaultChecked id="zip" type="checkbox" />
    </div>
    <div className="options">
      <p className="checkboxLabel">mp4ify</p>
      <input onClick={(e) => handleCheck(e)} className="features" defaultChecked id="mp4" type="checkbox" />
    </div>
    <div className="options">
      <p className="checkboxLabel">upload</p>
      <input onClick={(e) => handleCheck(e)} className="features" defaultChecked id="upload" type="checkbox" />
    </div>
  </div>
);

export default CheckBoxes;
