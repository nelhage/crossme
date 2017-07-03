import React from 'react';

import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

/* eslint-disable import/prefer-default-export */

export class UserInfo extends React.Component {
  componentDidMount() {
    // Use Meteor Blaze to render login buttons
    this.loginTemplate = Blaze.render(
      Template.loginButtons,
      this.loginNode);
  }

  componentWillUnmount() {
    Blaze.remove(this.loginTemplate);
  }

  render() {
    return (
      <li className="dropdown" id="userinfo">
        <a className="dropdown-toggle" data-toggle="dropdown">
          {this.props.currentUser ?
            <span>{this.props.currentUser.profile.name} <b className="caret" /></span>
              :
            <span>Login <b className="caret" /></span>
              }
        </a>
        <div className="dropdown-menu" role="menu">
          {!this.props.currentUser &&
            <p>Log in to remember your recent games, and show up in player
                lists!</p>
            }
          <p ref={(c) => { this.loginNode = c; }} />
        </div>
      </li>
    );
  }
}

export class RecentGames extends React.Component {
  render() {
    const games = this.props.games.map(game => (
      <li key={game._id}>
        <a className="game" href={`/game/${game._id}`}>
          {game.title} <span className="datestamp">(last viewed: {game.lastSeen})</span>
        </a>
      </li>
      ));
    return (
      <div>
        <a className="dropdown-toggle" data-toggle="dropdown">
          Recent Games<b className="caret" />
        </a>
        <ul className="dropdown-menu" role="menu">
          {games}
        </ul>
      </div>
    );
  }
}
