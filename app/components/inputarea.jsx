import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function DT() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [shown, setShown] = useState(false);
  return (
    <>
      <button type="button" className="feature">Select Date</button>
      {shown
        ? (
          <div className="dateModalModal">
            <div className="dateModal">
              <div className="date">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => { setSelectedDate(date); console.log(date); }}
                  isClearable
                  showTimeSelect
                />
              </div>
            </div>
          </div>
        )
        : (<> </>)}
    </>
  );
}

const InputArea = ({ inputHandler }) => (
  <div
    className="folder dropArea grayArea"
  >
    <h3 className="dropTitle">Info</h3>
    <div className="inputArea " />
    <DT />
    <div className="videoData">
      <input
        onChange={(e) => inputHandler(e)}
        type="date"
        id="startDate"
        name="startDate"
        className="inputForInfo"
      />
      <input
        onChange={(e) => inputHandler(e)}
        type="time"
        id="startTime"
        name="startTime"
        min="09:00"
        max="20:00"
        className="inputForInfo"
      />
      <input onChange={(e) => inputHandler(e)} id="type" className="titleInput inputForInfo" type="text" placeholder="type beat" />
      <input maxLength="100" onChange={(e) => inputHandler(e)} id="title" className="titleInput inputForInfo" type="text" placeholder="SEO Optimized Title" />
      <textarea onChange={(e) => inputHandler(e)} className="tagsTextArea inputForInfo" id="tags" name="tags" rows="4" cols="50" defaultValue="Paste Tags Here" />
      <textarea onChange={(e) => inputHandler(e)} className="tagsTextArea inputForInfo" id="description" name="description" rows="4" cols="50" defaultValue="Further Description About The Beats, The Related Artists, Etc" />
    </div>
  </div>
);

export default InputArea;
