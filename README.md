CrossMe -- A collaborative crossword-puzzle solver
--------------------------------------------------

CrossMe is a collaborative crossword puzzle solver.

CrossMe supports puzzles in the ".puz" format used
by ["Across Lite"][1] (format documentation in
[docs/file_format.md][2]), and standard crosswords in the
Crossword Compiler XML ".jpz" format (see [docs/jpz_format.md][jpz]).

[1]: http://www.litsoft.com/across/alite/download/
[2]: docs/file_format.md
[jpz]: docs/jpz_format.md

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

Preview image
-------------

`Dockerfile.preview` builds the client and the server into a single
image, for throwaway per-PR preview instances. (Production keeps the two
apart: `Dockerfile` for the Go server, and `client/Dockerfile` +
`client/nginx.conf` for the bundle behind nginx.) The server serves the
built client itself here, via `-static-dir` / `CROSSME_STATIC_DIR`.

    docker build -f Dockerfile.preview -t crossme-preview .
    docker run -p 4000:4000 crossme-preview

The app is then at `http://localhost:4000`. Each container starts on an
empty database, and that database dies with the container. Google login
is off by default and enabled exactly as in production, with
`CROSSME_GOOGLE_CLIENT_ID`, `CROSSME_GOOGLE_CLIENT_SECRET` and
`CROSSME_BASE_URL` (the last being the URL the browser reaches the
preview at, whose `/api/auth/google/callback` must be a registered
redirect URI).
