import React from 'react';
import classNames from 'classnames';
import { withTracker } from 'meteor/react-meteor-data';

import { DropdownButton, MenuItem, Modal, Button } from 'react-bootstrap';

import PlayerListContainer from './player_list.jsx';

class RevealControl extends React.Component {
  render() {
    return (
      <DropdownButton title="Reveal" id="dReveal" onSelect={this.props.doReveal} onToggle={this.props.onToggle}>
        <MenuItem data-target="square">Square</MenuItem>
        <MenuItem data-target="word">Word</MenuItem>
        <MenuItem data-target="grid">Grid</MenuItem>
      </DropdownButton>
    );
  }
}

class CheckControl extends React.Component {
  render() {
    return (
      <DropdownButton title="Check" id="dCheck" onSelect={this.props.doCheck} onToggle={this.props.onToggle}>
        <MenuItem data-target="square">Square</MenuItem>
        <MenuItem data-target="word">Word</MenuItem>
        <MenuItem data-target="grid">Grid</MenuItem>
      </DropdownButton>
    );
  }
}

class PencilControl extends React.Component {
  click(e) {
    this.props.onSetPencil(e.currentTarget.dataset.pencil === 'true');
  }

  render() {
    return (
      <div className="btn-group">
        <button
          data-pencil="false"
          className={classNames('btn', { active: !this.props.isPencil })}
          onClick={this.click.bind(this)}
        >
          Pen
        </button>
        <button
          data-pencil="true"
          className={classNames('btn', { active: this.props.isPencil })}
          onClick={this.click.bind(this)}
        >
          Pencil
        </button>
      </div>
    );
  }
}

const PencilControlContainer = withTracker(() => {
  return {
    isPencil: Session.get('pencil'),
    onSetPencil: p => (Session.set('pencil', p)),
  };
})(PencilControl);

class RebusControl extends React.Component {
  click() {
    Session.set('rebus', true);
  }

  render() {
    return (
      <div className="btn-group">
        <button
          className="btn"
          onClick={this.click.bind(this)}
        >
          Rebus
        </button>
      </div>
    );
  }
}

class KeyboardShortcuts extends React.Component {
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
      <div>
        <a role="button" className="sidebar-link" onClick={this.open.bind(this)}>Keyboard Shortcuts</a>
        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Body>
            <div className="contents">
              <table>
                <tbody>
                  <tr>
                    <th>&lt;Alt&gt;+p</th>
                    <td>Toggle pencil/pen</td>
                  </tr>
                  <tr>
                    <th>Arrows</th>
                    <td>Move+toggle direction</td>
                  </tr>
                  <tr>
                    <th>TAB</th>
                    <td>Next clue</td>
                  </tr>
                  <tr>
                    <th>Enter</th>
                    <td>Toggle direction</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    );
  }
}

class UserPreferences extends React.Component {
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


  isSettingChecked(setting, value, isDefault) {
    const curValue = this.props.currentUser.profile[setting];
    if (setting === undefined) {
      return isDefault ? 'checked' : '';
    }
    return curValue === value ? 'checked' : '';
  }

  updateSetting(e) {
    const target = $(e.currentTarget);
    const inputName = target.attr('name');
    const inputValue = target.attr('value');
    Meteor.call('updateSetting', inputName, inputValue);
  }

  render() {
    if (this.props.currentUser) {
      const onChange = this.updateSetting.bind(this);
      return (
        <div>
          <a role="button" className="sidebar-link" onClick={this.open.bind(this)}>Settings</a>
          <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
            <Modal.Header>
              <Modal.Title>Solving Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form className="form">
                <h5>After changing direction with the arrow keys:</h5>
                <div className="radio">
                  <label htmlFor="settingArrows">
                    <input
                      type="radio"
                      name="settingArrows"
                      value="stay"
                      checked={this.isSettingChecked('settingArrows', 'stay', true)}
                      onChange={onChange}
                    />
                    Stay in the same square
                  </label>
                </div>
                <div className="radio">
                  <label htmlFor="settingArrows">
                    <input
                      type="radio"
                      name="settingArrows"
                      value="move"
                      checked={this.isSettingChecked('settingArrows', 'move', false)}
                      onChange={onChange}
                    />
                    Move in the direction of the arrow
                  </label>
                </div>

                <h5>Within a word:</h5>
                <div className="radio">
                  <label htmlFor="settingWithinWord">
                    <input
                      type="radio"
                      name="settingWithinWord"
                      value="skip"
                      checked={this.isSettingChecked('settingWithinWord', 'skip', true)}
                      onChange={onChange}
                    />
                    Skip over filled squares
                  </label>
                </div>
                <div className="radio">
                  <label htmlFor="settingWithinWord">
                    <input
                      type="radio"
                      name="settingWithinWord"
                      value="overwrite"
                      checked={this.isSettingChecked('settingWithinWord', 'overwrite', false)}
                      onChange={onChange}
                    />
                    Overwrite filled in squares
                  </label>
                </div>

                <h5>At the end of a word:</h5>
                <div className="checkbox">
                  <label htmlFor="settingEndWordBack">
                    <input
                      type="checkbox"
                      name="settingEndWordBack"
                      value="back"
                      checked={this.isSettingChecked('settingEndWordBack', 'back', true)}
                      onChange={onChange}
                    />
                    Jump back to first blank in the word (if any)
                  </label>
                </div>
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.close.bind(this)}>Close</Button>
            </Modal.Footer>
          </Modal>
        </div>
      );
    }
    return null;
  }
}

export default class Sidebar extends React.Component {
  constructor(props) {
    super(props);

    this.onToggle = this.onToggle.bind(this);
  }

  onToggle(isOpen) {
    if (!isOpen && this.props.resetFocus) {
      this.props.resetFocus();
    }
  }

  render() {
    return (
      <div id="controls">
        <ul className="nav nav-pills nav-stacked">
          <li>
            <RevealControl doReveal={this.props.doReveal} onToggle={this.onToggle} />
          </li>
          <li>
            <CheckControl doCheck={this.props.doCheck} onToggle={this.onToggle} />
          </li>
          <li>
            <PencilControlContainer />
          </li>
          <li>
            <RebusControl />
          </li>
          <li className="player-label"> Now playing:</li>
          <li>
            <PlayerListContainer gameId={this.props.gameId} />
          </li>
        </ul>
        <KeyboardShortcuts />
        <UserPreferences currentUser={this.props.currentUser} />
      </div>
    );
  }
}
