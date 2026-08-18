import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";

import { useUser } from "../user";

import "./style/account.css";

// The header's account corner: a sign-in link when anonymous, or the
// signed-in user with a sign-out menu.
export const Account = () => {
  const { user, clearUser } = useUser();

  if (!user) {
    // A plain link, not a router navigation: signing in is a full-page
    // redirect through the server's OAuth flow.
    return <Nav.Link href="/api/auth/google/login">Sign in</Nav.Link>;
  }

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // The cookie may outlive this failure, but locally we're signed
      // out either way; a reload will re-ask the server.
    }
    clearUser();
  };

  const title = (
    <span className="account-title">
      {user.avatarUrl && (
        <img
          className="account-avatar"
          src={user.avatarUrl}
          alt=""
          // Google's avatar CDN can reject requests carrying a referrer.
          referrerPolicy="no-referrer"
        />
      )}
      {user.displayName || user.email || "Account"}
    </span>
  );

  return (
    <NavDropdown title={title} id="account-dropdown" align="end">
      {user.email && (
        <NavDropdown.ItemText className="text-muted">
          {user.email}
        </NavDropdown.ItemText>
      )}
      <NavDropdown.Item onClick={signOut}>Sign out</NavDropdown.Item>
    </NavDropdown>
  );
};
