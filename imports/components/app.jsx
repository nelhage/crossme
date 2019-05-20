import React from 'react';

import { withTracker } from 'meteor/react-meteor-data';

import Header from './header.jsx';
import Puzzle from './puzzle.jsx';

/* eslint-disable import/prefer-default-export */

class Home extends React.Component {
  render() {
    return (
      <div className="container">
        <meta name="viewport" content="width=device-width" />
        <h2>Welcome to CrossMe!</h2>

        <p>CrossMe is an online collaborative crossword-puzzle solver,
          written in <a href="http://www.meteor.com/">Meteor</a> by
          <a href="https://nelhage.com/">Nelson Elhage</a>.</p>

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

const withCurrentUser = withTracker(() => {
  return { currentUser: Meteor.user() };
});


class App extends React.Component {
  componentDidMount() {
    this.timerId = setInterval(
      () => this.ping(),
      30 * 1000,
    );
    this.ping();
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  ping() {
    if (this.props.gameId && this.props.currentUser) {
      Meteor.call('ping', this.props.gameId);
    }
  }

  render() {
    let body = null;
    if (this.props.gameId || this.props.puzzleId) {
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
        />
        {body}
      </div>
    );
  }
}


export default withCurrentUser(App);
