import React from 'react';
import { Modal, Button, Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';

import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

/* global Router */

class UserInfo extends React.Component {
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

class RecentGames extends React.Component {
  render() {
    const games = this.props.games.map(game => (
      <MenuItem href={`/game/${game._id}`}>
        {game.title} <span className="datestamp">(last viewed: {game.lastSeen})</span>
      </MenuItem>
    ));
    return (
      <NavDropdown title="Recent Games">
        {games}
      </NavDropdown>
    );
  }
}

class NewGameModal extends React.Component {
  doPreview(evt) {
    evt.preventDefault();
    const id = this.switchPuzzle.value;
    this.props.onClose();
    Router.go('preview', { id });
  }

  newGame(evt) {
    evt.preventDefault();
    const id = this.switchPuzzle.value;
    Meteor.call('newGame', id, (error, gotId) => {
      this.props.onClose();
      if (!error) {
        Router.go('game', { id: gotId });
      }
    });
  }

  handleUpload (evt) {
    evt.preventDefault();
    const files = this.puzzleFiles.files;
    if (!files.length) {
      /* TODO: error state */
      return;
    }

    this.props.onUpload(files);
    this.props.onClose();
  }

  render() {
    const puzzles = this.props.puzzles.map(puzzle => (
      <option key={puzzle._id} value={puzzle._id}>
        {puzzle.title}
      </option>
      ));
    return (
      <Modal show={this.props.showModal} onHide={this.props.onClose}>
        <Modal.Header>
          <Modal.Title>Start a new game...</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div id="selector">
            <form className="form-inline">
              <label htmlFor="switchpuzzle">Puzzle:</label>
              <select id="switchpuzzle" ref={(c) => { this.switchPuzzle = c; }}>
                {puzzles}
              </select>
              <Button className="btn-preview" onClick={this.doPreview.bind(this)}>Preview</Button>
              <Button className="btn-primary" onClick={this.newGame.bind(this)}>New Game</Button>
            </form>
          </div>

          <form id="uploadform">
            <div>
              Or upload new <a href="https://code.google.com/p/puz/wiki/FileFormat">.puz</a>:
              <input id="puzfile" type="file" ref={(c) => { this.puzzleFiles = c; }} multiple />
              <Button className="btn-primary" onClick={this.handleUpload.bind(this)}>Upload</Button>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.onClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

class NewGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showModal: false };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  render() {
    return (
      <NavItem href='#'>
        <a role="button" onClick={this.open.bind(this)}>New Game</a>
        <NewGameModal
          showModal={this.state.showModal}
          onClose={this.close.bind(this)}
          onUpload={this.props.onUpload}
          puzzles={this.props.puzzles}
        />
      </NavItem>
    );
  }
}

export default class Header extends React.Component {
  render() {
    return (
      <Navbar staticTop>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="/">CrossMe</a>
          </Navbar.Brand>
        </Navbar.Header>
        <Nav>
          <NewGame
            puzzles={this.props.puzzles}
            onUpload={this.props.handleUpload}
          />
          {this.props.currentUser &&
            <RecentGames games={this.props.recentGames} />
          }
        </Nav>
        <Nav pullRight>
          <UserInfo currentUser={this.props.currentUser} />
        </Nav>
      </Navbar>
    );
  }
}
