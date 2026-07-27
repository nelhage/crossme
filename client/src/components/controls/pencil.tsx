import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

export interface PencilProps {
  isPencil: boolean;

  setPencil: (pencil: boolean) => void;
}

export const Pencil = ({ isPencil, setPencil }: PencilProps) => {
  return (
    <ButtonToolbar>
      <ToggleButtonGroup
        type="radio"
        name="pen-or-pencil"
        value={isPencil ? "pencil" : "pen"}
        onChange={(value: string) => setPencil(value === "pencil")}
      >
        <ToggleButton id="pen" value="pen">
          Pen
        </ToggleButton>
        <ToggleButton id="pencil" value="pencil">
          Pencil
        </ToggleButton>
      </ToggleButtonGroup>
    </ButtonToolbar>
  );
};
