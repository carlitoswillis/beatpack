import React, { useState, useEffect } from 'react';

// https://gist.github.com/DOSputin/71cbd644aef33f4c465b525383cb5b33

const LCD = ({
  backlit, line1, line2, width, height,
}) => {
  const bgcolor = backlit ? '#111111' : '#000000';
  return (
    <svg className="LCD" viewBox="0 0 78 32" width={width} height={height}>
      <defs>

        <lineargradient
          id="c"
          x1="417.79"
          x2="458.73"
          y1="103.78"
          y2="142.81"
          gradientTransform="translate(-401.72 -103.94)"
          gradientUnits="userSpaceOnUse"
          xlinkHref="#a"
        >

          <lineargradient id="a">
            <stop offset="0" stopColor="#454545" />
            <stop offset="1" stopColor="#646464" stopOpacity=".3" />
          </lineargradient>
        </lineargradient>

      </defs>
      <path
        fill="#333"
        stroke="url(#a)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth=".28"
        d="M3.55 3.19h77.89V34.9H3.55z"
        transform="translate(-3.41 -3.05)"
      />
      <path
        fill="#161616"
        stroke="url(#a)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth=".26"
        d="M5.12 4.33h74.96v29.31H5.12z"
        transform="translate(-3.41 -3.05)"
      />
      <path
        fill="#333"
        stroke="#646464"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity=".3"
        strokeWidth=".28"
        d="M7.51 6.95h70.34v24.42H7.51z"
        transform="translate(-3.41 -3.05)"
      />
      <path
        fill={bgcolor}
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity=".3"
        strokeWidth=".28"
        d="M8.76 8.3h67.73v21.6H8.76z"
        transform="translate(-3.41 -3.05)"
      />
      <text
        fill="#2fa4f6"
        x="10"
        y="17"
        fontFamily="HD44780"
        fontSize="5.5"
        transform="translate(-3.41 -3.05)"
        style={{ whiteSpace: 'pre' }}
      >
        {line1}
      </text>
      <text
        fill="#2fa4f6"
        x="10"
        y="26"
        fontFamily="HD44780"
        fontSize="5.5"
        transform="translate(-3.41 -3.05)"
        style={{ whiteSpace: 'pre' }}
      >
        {line2}
      </text>
    </svg>
  );
};

export default LCD;
