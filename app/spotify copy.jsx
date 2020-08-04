/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import SearchArea from './components/searcharea';

const $ = require('jquery');

class YoutubeSearch extends Component {
  constructor(props) {
    super(props);
    this.state = { searchTerm: '', results: [] };
  }

  handleChange(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ searchTerm: e.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    const { searchTerm } = this.state;
    if (searchTerm !== '') {
      const settings = {
        url: `http://localhost:5000/youtube?searchTerm=${searchTerm}`,
        method: 'GET',
        timeout: 0,
      };
      $.ajax(settings).done((response) => {
        const state = { searchTerm };
        state.results = response;
        this.setState(state);
      });
    }
  }

  handleClear() {
    const state = { results: [], searchTerm: '' };
    this.setState(state);
  }

  render() {
    const { results } = this.state;
    return (
      <div>
        <h1>Artist Finder</h1>
        <div onClick={() => { this.handleClear(); }} onKeyDown={() => { this.handleClear(); }} className="buttons" id="flush">
          <p>
            Reset Files
          </p>
        </div>
        <SearchArea platform="Youtube" results={results} handleSubmit={this.handleSubmit.bind(this)} handleChange={this.handleChange.bind(this)} />
      </div>
    );
  }
}

ReactDOM.render(
  // <App testInfo={test()} />,
  <YoutubeSearch />,
  document.getElementById('app'),
);
