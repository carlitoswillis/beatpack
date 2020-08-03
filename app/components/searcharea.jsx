/* eslint-disable react/prop-types */
import React from 'react';

const SearchArea = ({
  platform, handleChange, handleSubmit, results,
}) => (
  <div className={platform.toLowerCase()}>
    <h2>
      Search for Similar Artists on
      {' '}
      {platform}
    </h2>
    <div id={`${platform.toLowerCase()}Search`} className="search">
      <input onChange={(e) => handleChange(e)} id={`${platform.toLowerCase()}SearchBox`} className="searchBox" type="text" />
      <button onClick={(e) => handleSubmit(e)} id={`${platform.toLowerCase()}SearchButton`} className="go" type="submit">Search</button>
    </div>
    <div id={`${platform.toLowerCase()}Results`} className="results">
      {results.map((artist) => (
        artist.originalSearch
          ? (
            <div key={artist.id} id={artist.id} className="searchedArtist">
              <a href={artist.images[1] ? artist.images[1].url : artist.images[0] ? artist.images[0].url : `https://www.google.com/search?q=picture+of+${artist}`} rel="noreferrer" target="_blank"><img className="artistPic searchedArtistPic" src={artist.images[1] ? artist.images[1].url : artist.images[0] ? artist.images[0].url : 'https://merriam-webster.com/assets/mw/images/article/art-wap-article-main/egg-3442-e1f6463624338504cd021bf23aef8441@1x.jpg'} alt={artist.name} /></a>
              <div className="artistName">
                <a href={artist.external_urls.spotify} rel="noreferrer" target="_blank">
                  {artist.name}
                </a>
              </div>
              <p className="followers">
                followers:
                {' '}
                {artist.followers.total}
              </p>
              <p className="genres">
                genres:
                {' '}
                {JSON.stringify(artist.genres)}
              </p>
            </div>
          )
          : (
            <div key={artist.id} id={artist.id} className="result">
              <a href={artist.images[0] ? artist.images[0].url : `https://www.google.com/search?q=picture+of+${artist}`} rel="noreferrer" target="_blank"><img className="artistPic" src={artist.images[0] ? artist.images[0].url : 'https://merriam-webster.com/assets/mw/images/article/art-wap-article-main/egg-3442-e1f6463624338504cd021bf23aef8441@1x.jpg'} alt={artist.name} /></a>
              <div className="artistName">
                <a href={artist.external_urls.spotify} rel="noreferrer" target="_blank">
                  {artist.name}
                </a>
              </div>
              <p className="followers">
                followers:
                {' '}
                {artist.followers.total}
              </p>
              <p className="genres">
                genres:
                {' '}
                {JSON.stringify(artist.genres)}
              </p>
            </div>
          )
      ))}
    </div>
  </div>
);

export default SearchArea;
