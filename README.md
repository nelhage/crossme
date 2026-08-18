CrossMe -- A collaborative crossword-puzzle solver
--------------------------------------------------

CrossMe is a collaborative crossword puzzle solver.

CrossMe supports puzzles in the ".puz" format used
by ["Across Lite"][1]. You can find format documentation
in [docs/file_format.md][2].

[1]: http://www.litsoft.com/across/alite/download/
[2]: docs/file_format.md

User accounts
-------------

Signing in is optional — anonymous play always works — but users can
sign in with Google. To enable it, create an OAuth client in the
[Google Cloud console][3] (type "Web application") and run the server
with:

- `-google-client-id` / `CROSSME_GOOGLE_CLIENT_ID`: the OAuth client ID.
  If empty (the default), Google login is disabled and the auth routes
  don't exist.
- `-google-client-secret` / `CROSSME_GOOGLE_CLIENT_SECRET`: the OAuth
  client secret.
- `-base-url` / `CROSSME_BASE_URL`: the URL the *browser* reaches the
  app at (default `http://localhost:3000`, the vite dev server).

The OAuth client must have `<base-url>/api/auth/google/callback`
registered as an authorized redirect URI — e.g.
`http://localhost:3000/api/auth/google/callback` for development.

[3]: https://console.cloud.google.com/apis/credentials
