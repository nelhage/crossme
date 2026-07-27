import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";

export interface RebusProps {
  onClick: () => void;
}

export const Rebus = ({ onClick }: RebusProps) => {
  return (
    <ButtonGroup>
      <Button onClick={onClick}>Rebus</Button>
    </ButtonGroup>
  );
};
