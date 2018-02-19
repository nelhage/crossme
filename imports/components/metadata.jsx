import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';

/* global Router, Games */

const withGame = withTracker(({ gameId }) => {
  return {
    game: Games.findOne({ _id: gameId }),
  };
});

class Metadata extends React.Component {
  startGame() {
    const id = this.props.puzzle._id;
    Meteor.call('newGame', id, function (error, gotId) {
      if (!error) {
        Router.go('game', { id: gotId });
      }
    });
  }

  render() {
    return (
      <div id="details">
        <div className="title">
          <span className="label label-default">Title</span>
          {' '}
          <span className="value">{this.props.puzzle.title}</span>
          {this.props.game && this.props.game.solved && (
            <span className="label label-success">Solved!</span>
          )}

          {(!this.props.gameId) && (
            <span>
              <span className="preview label">Preview</span>
              <button className="btn" onClick={this.startGame.bind(this)}>Start Game</button>
            </span>
          )}
        </div>
        <div className="author">
          <span className="label label-default">By</span>
          {' '}
          <span className="value">{this.props.puzzle.author}</span>
        </div>
        {this.props.puzzle.note && (
           <div className="note">
             <span className="label label-default">Note</span>
             {' '}
             <span className="value">{this.props.puzzle.note}</span>
           </div>
        )}
      </div>
    );
  }
}

export default withGame(Metadata);
