import React from 'react';

import classNames from 'classnames';

import { withCursor } from '../ui/cursor.jsx';

class ClueBox extends React.Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  onSelect(e) {
    const target = e.target;
    this.props.onSelect(parseInt(target.dataset.number, 10),
                        target.dataset.direction);
  }

  isSelected(clue, direction) {
    if (this.props.cursor[`word_${direction}`] !== clue.number) {
      return false;
    }
    if (this.props.cursor.selected_direction === direction) {
      return 'selected';
    }
    return 'otherword';
  }

  clueGroup(clues) {
    return (
      clues.map(c => (
        <Clue
          key={c._id}
          number={c.number}
          text={c.text}
          direction={c.direction}
          selected={this.isSelected(c, c.direction)}
          onClick={this.onSelect}
        />
        ))
    );
  }

  render() {
    const acrossClues = this.clueGroup(this.props.clues.across, 'across');
    const downClues = this.clueGroup(this.props.clues.down, 'down');
    return (
      <div id="clues" className="visible-md-block visible-lg-block">
        <div className="section across">
          <div className="title"> Across </div>
          <div className="cluelist">
            {acrossClues}
          </div>
        </div>
        <div className="section down">
          <div className="title"> Down </div>
          <div className="cluelist">
            {downClues}
          </div>
        </div>
      </div>
    );
  }
}

class Clue extends React.Component {
  render() {
    const classes = classNames('clue', `clue-${this.props.number}`, this.props.selected);
    return (
      <div
        role="button"
        className={classes}
        onClick={this.props.onClick}
        data-number={this.props.number}
        data-direction={this.props.direction}
      >
        {this.props.number}. {this.props.text}
      </div>
    );
  }
}

export default withCursor(ClueBox);
