import React from 'react';

const Checkbox = ({
  id, name, info, handleCheck, setMouseIsDown, mouseIsDown,
}) => (
  <div className="options">
    {info[id]
      ? (
        <button
          onMouseDown={(e) => {
            handleCheck(id);
            setMouseIsDown(true);
          }}
          onMouseUp={() => setMouseIsDown(false)}
          onMouseEnter={mouseIsDown ? () => handleCheck(id) : () => {}}
          className="features selectedFeature"
          defaultChecked
          id={id}
          type="button"
        >
          {name}
        </button>
      )
      : (
        <button
          onMouseDown={() => {
            handleCheck(id);
            setMouseIsDown(true);
          }}
          onMouseUp={() => setMouseIsDown(false)}
          onMouseEnter={mouseIsDown ? () => handleCheck(id) : () => {}}
          className="features notSelectedFeature"
          defaultChecked
          id={id}
          type="button"
        >
          {name}
        </button>
      )}
  </div>
);

const CheckBoxes = ({
  handleCheck, info, setMouseIsDown, mouseIsDown, customChecks,
}) => (
  <div className={customChecks ? 'videoChecks' : 'mainCheckboxes'}>
    {customChecks
      ? (
        <>
          {customChecks.map((id) => <Checkbox mouseIsDown={mouseIsDown} setMouseIsDown={setMouseIsDown} handleCheck={handleCheck} key={id} id={id} name={id} info={info} />)}
        </>
      )
      : (
        <>
          {['mp3', 'zip', 'art', 'video', 'upload'].map((id) => <Checkbox mouseIsDown={mouseIsDown} setMouseIsDown={setMouseIsDown} handleCheck={handleCheck} key={id} id={id} name={id} info={info} />)}
          <Checkbox mouseIsDown={mouseIsDown} setMouseIsDown={setMouseIsDown} handleCheck={handleCheck} id="cleanUp" name="delete" info={info} />
          <Checkbox mouseIsDown={mouseIsDown} setMouseIsDown={setMouseIsDown} handleCheck={handleCheck} id="all" name="all" info={info} />
        </>
      )}
  </div>
);

export default CheckBoxes;
