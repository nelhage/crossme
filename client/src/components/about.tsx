import { Link } from "react-router";

export const About = () => {
  return (
    <div className="container">
      <h2>Welcome to CrossMe!</h2>

      <p>
        CrossMe is an online collaborative crossword-puzzle solver by{" "}
        <a href="https://nelhage.com/">Nelson Elhage</a>.
      </p>

      <p>
        To get started, browse the <Link to="/puzzles">puzzles</Link>, pick one,
        and click &quot;Solve&quot; to get going right away, or click its title
        to preview the puzzle before you start playing.
      </p>

      <p>
        CrossMe is <a href="https://github.com/nelhage/crossme">open-source</a>.
        Please open an issue on github if you have any issues, or just drop me
        an <a href="mailto:nelhage@nelhage.com">email</a>.
      </p>
    </div>
  );
};
