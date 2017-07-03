import React from 'react';

export default class PlayerList extends React.Component {
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
