import NavDropdown from "react-bootstrap/NavDropdown";

import { Link } from "react-router";

import { useRecentGames, type RecentGame } from "../recent_games";

import "./style/recent_games.css";

function formatPlayedAt(playedAt: number): string {
  return new Date(playedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const RecentGameItem = ({ game }: { game: RecentGame }) => (
  <NavDropdown.Item as={Link} to={`/game/${game.gameId}`}>
    <div className="recent-game">
      <span className="title">{game.title || "Untitled puzzle"}</span>
      <span className="played-at">{formatPlayedAt(game.playedAt)}</span>
    </div>
    {game.author && <div className="author">By {game.author}</div>}
  </NavDropdown.Item>
);

export const RecentGames = () => {
  const games = useRecentGames();

  return (
    <NavDropdown title="Recent Games" id="recent-games-dropdown">
      {games.length === 0 ? (
        <NavDropdown.ItemText className="text-muted">
          No recent games
        </NavDropdown.ItemText>
      ) : (
        games.map((game) => <RecentGameItem key={game.gameId} game={game} />)
      )}
    </NavDropdown>
  );
};
