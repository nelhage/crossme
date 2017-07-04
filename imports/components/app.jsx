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
    if (this.props.puzzle) {
      body = (
        <Puzzle
          puzzle={this.props.puzzle}
          preview={this.props.preview}
          currentClue={this.props.currentClue}
          currentUser={this.props.currentUser}
          cursor={this.props.cursor}
          grid={this.props.grid}
          clues={this.props.clues}
          onClickCell={this.props.onClickCell}
          onSelect={this.props.selectClue}
          doReveal={this.props.doReveal}
          doCheck={this.props.doCheck}
          isPencil={this.props.isPencil}
          players={this.props.players}
        />);
    } else {
      body = <Home />;
    }
    return (
      <div>
        <Header
          puzzles={this.props.puzzles}
          recentGames={this.props.recentGames}
          onUpload={this.props.onUpload}
          currentUser={this.props.currentUser}
        />
        {body}
      </div>
    );
  }
}
