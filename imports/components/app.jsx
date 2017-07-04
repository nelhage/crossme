import React from 'react';

/* eslint-disable import/prefer-default-export */

export class Home extends React.Component {
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
