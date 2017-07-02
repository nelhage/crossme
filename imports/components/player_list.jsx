export class PlayerList extends React.Component {
  render() {
    var players = this.props.players.map(function(player) {
      return (<PlayerListEntry key={player._id} {...player} />);
    });
    var logIn = null;
    if (!this.props.loggedIn) {
      logIn = <li>
        <strong>Log In</strong> to join this list
      </li>;
    }
    return (
      <ul id='player-list'>
        {players}
        {logIn}
      </ul>
    );
  }
}

class PlayerListEntry extends React.Component {
  render() {
    if (this.props.isMe) {
      return (
        <li>
          <input className='my-name' type='text'
                 value={this.props.user.profile.name}
                 onChange={this.nameChanged}/>
        </li>
      );
    } else {
      return (
        <li>
          {this.props.user.profile.name}
        </li>
      );
    }
  }

  nameChanged(e) {
    e.preventDefault();
    Meteor.call('setName', $(e.currentTarget).val());
  }
}
