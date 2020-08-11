import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function DT() {
  const [selectedDate, setSelectedDate] = useState(null);

  return (
    <div className="dateModal">
      <div className="date">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => { setSelectedDate(date); console.log(date)}}
          isClearable
          showTimeSelect
        />
      </div>
    </div>
  );
}

const InputArea = () => (
  <div
    className="folder dropArea grayArea"
  >
    <h3 className="dropTitle">Info</h3>
    <div className="inputArea ">
    </div>
    <DT />
  </div>
);

export default InputArea;
