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
