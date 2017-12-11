import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';

/* global Games */

class PlayerList extends React.Component {
  render() {
    const players = this.props.players.map(function(player) {
      return (<PlayerListEntry key={player._id} {...player} />);
    });
    let logIn = null;
    if (!this.props.loggedIn) {
      logIn = (
        <li>
          <strong>Log In</strong> to join this list
        </li>);
    }
    return (
      <ul id="player-list">
        {players}
        {logIn}
      </ul>
    );
  }
}

class PlayerListEntry extends React.Component {
  nameChanged(e) {
    e.preventDefault();
    Meteor.call('setName', $(e.currentTarget).val());
  }

  render() {
    if (this.props.isMe) {
      return (
        <li>
          <input
            className="my-name"
            type="text"
            value={this.props.user.profile.name}
            onChange={this.nameChanged}
          />
        </li>
      );
    }
    return (
      <li>
        {this.props.user.profile.name}
      </li>
    );
  }

}

export default createContainer(({ gameId }) => {
  let players = [];
  const userId = Meteor.userId();
  if (gameId) {
    const game = Games.findOne({ _id: gameId });
    if (game && game.players) {
      players = game.players.map((who) => {
        return {
          _id: who.userId,
          user: Meteor.users.findOne({ _id: who.userId }),
          isMe: who.userId === userId,
        };
      });
    }
  }
  return {
    loggedIn: !!userId,
    players,
  };
}, PlayerList);
