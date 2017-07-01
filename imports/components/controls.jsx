import { DropdownButton, MenuItem } from 'react-bootstrap';

export class RevealControl extends React.Component {
  render() {
    return (
      <DropdownButton title="Reveal" id='dReveal' onSelect={this.props.doReveal}>
        <MenuItem data-target='square'>Square</MenuItem>
        <MenuItem data-target='word'>Word</MenuItem>
        <MenuItem data-target='grid'>Grid</MenuItem>
      </DropdownButton>
    )
  }
}

export class CheckControl extends React.Component {
  render() {
    return (
      <DropdownButton className={this.props.checkOk && "check-ok"} title="Check" id='dCheck' onSelect={this.props.doCheck}>
        <MenuItem data-target='square'>Square</MenuItem>
        <MenuItem data-target='word'>Word</MenuItem>
        <MenuItem data-target='grid'>Grid</MenuItem>
      </DropdownButton>
    )
  }
}
