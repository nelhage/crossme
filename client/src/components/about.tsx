import { Link } from "react-router";

export const About = () => {
  return (
    <div className="container">
      <h2>About CrossMe</h2>

      <p>
        CrossMe is an online crossword-puzzle solver by{" "}
        <a href="https://nelhage.com/">Nelson Elhage</a>, built for solving
        together: everyone who opens a game sees the same grid, and every letter
        anyone types shows up for the others as it happens.
      </p>

      <p>
        To play, browse the <Link to="/puzzles">puzzles</Link> and click
        &quot;Solve&quot; on one, or click its title to preview it first. To
        solve with friends, send them the URL of your game; anyone with the link
        can join. Signing in is optional, but keeps a record of your games so
        you can come back to them later.
      </p>

      <p>
        CrossMe is <a href="https://github.com/nelhage/crossme">open-source</a>.
        Please open an issue on GitHub if you run into a problem, or just drop
        me an <a href="mailto:nelhage@nelhage.com">email</a>.
      </p>
    </div>
  );
};
