# CrossMe Architecture

## High-level structure

The frontend web application is a React SPA located in the `client/` folder.

The backend is implemented in Go, and the frontend communicates with it via [connect-web], using GRPC. The protobuf files for both the client<->server protocol and the serialized data in the backend are defined in the `pb/` folder.

## Server details

The server stores data using sqlite. All direct interaction with the SQL database is managed via the `Repo` type, exported from the `repo` top-level package. Data is stored in the database primarily as encoded protobuf objects in `blob` columns, with a small number of fields replicated as SQL columns for efficient indexing or querying.

The SQL schema is defined by an ordered list of migrations in `repo/migrate.go`; `migrations[i]` upgrades the database from schema version `i` to version `i+1`, so the current schema version is just the number of migrations. The database records its own version in the `Config` proto stored in the `config` table, which is the one piece of schema created outside the migration sequence. Opening a database plays any missing migrations forward, each in a transaction that also stamps the new version; opening a database from the future is an error. Migrations are append-only: changing the schema means adding a migration, not editing an existing one. The app is deployed in beta against a live database, so this matters in practice — but the dataset is small, and migrations can be written in the simplest way that works without regard for how long they take.

Durable state is committed to the SQL database. Transient state about current connections and live games lives in-memory in the server. If the server restarts, we assume clients will reconnect if necessary. The server is assumed to be a single instance of the Go server process; there is no support for running across multiple processes or nodes.

## Users and authentication

Accounts are optional: every feature works anonymously, and signing in
only attaches durable identity (e.g. game ownership) on top. There are no
passwords; identity comes from external OIDC providers (currently
Google), via the server-side authorization-code flow implemented in the
`auth` package. The browser is redirected through
`/api/auth/{provider}/login` and `.../callback` — plain HTTP endpoints,
not RPCs — and comes back with an HttpOnly session cookie.

A `User` is our own record, keyed by our own id; each external login is
an `Identity` row keyed by (provider, subject) pointing at a user, so a
user can accumulate providers later. Users are matched only by that pair,
never by email. Sessions are durable (in sqlite, hashed) so restarts
don't log anyone out, and expire after 30 days of inactivity (a sliding
expiry, renewed at most daily).

HTTP middleware resolves the session cookie to a `User` on the request
context; RPC handlers read it with `auth.UserFromContext`, where a nil
user simply means an anonymous caller. The SPA learns who is signed in
via the `GetSelf` RPC, since it cannot read the cookie itself.

## The "Game" CRDT

A core feature of the application is simultaneous collaboration on a puzzle between multiple users.

This collaboration is implemented via a CRDT over the `Fill` protobuf object. A `Game` represents a single "instance" of a `Puzzle` which is being solved by one or more players; the mutable contents of the grid being filled in are stored in the `Fill`.

The CRDT `merge` implementation is implemented both client-side and server-side. When the client modifies the grid, it updates state locally and then sends an updated `Fill` to the server; the server performs a server-side merge, and then broadcasts the new state to all active clients, who merge it back in to their local state.

The CRDT is primarily a last-writer-wins structure on a per-cell basis, using Lamport clocks to determine ordering, but with a few exceptions:

- Some pieces of state ("has this cell ever been checked?") are sticky, and persist if **either** side has set them
- Cells which have been confirmed correct to the player (e.g. via checking or revealing their content) will always win, even in the face of later writes from another node.
- A `Fill` marked `complete` is terminal: it wins any merge wholesale, which freezes the game — nothing can ever change a completed fill. Only the server sets `complete`, after verifying the merged grid against the puzzle's solution; it then broadcasts the full canonical fill and drops any further updates to that game. Server-only stamping guarantees at most one distinct complete fill per game, which is what keeps the wholesale rule convergent.

[connect-web]: https://github.com/anysphere/connect-web
