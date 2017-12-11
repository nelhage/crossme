import React from 'react';

import Header from './header.jsx';
import Puzzle from './puzzle.jsx';

/* eslint-disable import/prefer-default-export */

class Home extends React.Component {
  render() {
    return (
      <div className="container">
        <h2>Welcome to CrossMe!</h2>

        <p>CrossMe is an online collaborative crossword-puzzle solver,
          written in <a href="http://www.meteor.com/">Meteor</a> by <a
            href="https://nelhage.com/"
          >Nelson Elhage</a>.</p>

        <p>To get started, just click &quot;New Game&quot; above, select a puzzle
          (I&apos;ve uploaded most of the recently NYT puzzles), and get started!
          In the popup, you can click &quot;New Game&quot; to get going right away, or
          &quot;Preview&quot; to view the puzzle before you start playing.</p>

        <p>CrossMe is <a href="https://github.com/nelhage/crossme">open-source</a>.  Please
          open an issue on github if you have any issues, or just drop me
          an <a href="mailto:nelhage@nelhage.com">email</a>.</p>
      </div>
    );
  }
}


export default class App extends React.Component {
  render() {
    let body = null;
    if (this.props.puzzleId) {
      body = (
        <Puzzle
          puzzleId={this.props.puzzleId}
          gameId={this.props.gameId}
          currentUser={this.props.currentUser}
          onClickCell={this.props.onClickCell}
          onSelect={this.props.onSelect}
          doReveal={this.props.doReveal}
          doCheck={this.props.doCheck}
        />);
    } else {
      body = <Home />;
    }
    return (
      <div>
        <Header
          currentUser={this.props.currentUser}
          onUpload={this.props.onUpload}
        />
        {body}
      </div>
    );
  }
}
