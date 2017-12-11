import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';

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
  constructor(props) {
    super(props);
    if (this.props.isMe) {
      this.state = { profile_name: this.props.user.profile.name };
    }

    this.submitName = this.submitName.bind(this);
    this.nameChanged = this.nameChanged.bind(this);
  }

  submitName() {
    Meteor.call('setName', this.state.profile_name);
  }

  nameChanged(e) {
    this.setState({ profile_name: e.target.value });
  }

  render() {
    if (!this.props.user || !this.props.user.profile) {
      return null;
    }
    if (this.props.isMe) {
      return (
        <li>
          <input
            className="my-name"
            type="text"
            value={this.state.profile_name}
            onChange={this.nameChanged}
            onBlur={this.submitName}
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

export default withTracker(({ gameId }) => {
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
})(PlayerList);
