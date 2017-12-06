import React from 'react';

/* global Router */

export default class Metadata extends React.Component {
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
          <span className="value"> {this.props.puzzle.title}</span>
          {(!this.props.gameId) && (
            <span>
              <span className="preview label">Preview</span>
              <button className="btn" onClick={this.startGame.bind(this)}>Start Game</button>
            </span>
          )}
        </div>
        <div className="author">
          <span className="label label-default">By</span>
          <span className="value">{this.props.puzzle.author}</span>
        </div>
      </div>
    );
  }
}
