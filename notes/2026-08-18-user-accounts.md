# User accounts via Google auth — implementation plan

Status: implemented (with sliding session renewal, throttled to one
write per day). See ARCHITECTURE.md's "Users and authentication" for the
as-built summary.

## Goals

- Users can sign in with Google. Other identity providers may come later, so
  nothing should hard-code "Google" beyond the provider integration itself.
- Auth is optional: every existing flow keeps working for anonymous visitors.
- Signed-in users get durable identity we can hang features off of later
  (server-side "my games", display names in collaborative games, etc.).

## Approach: server-side OIDC authorization-code flow

Two standard ways to do "Sign in with Google" for an SPA:

1. **Google Identity Services JS** in the browser, which hands the client an
   ID token that it posts to the server.
2. **Server-side authorization-code flow**: the browser navigates to
   `/api/auth/google/login`, the Go server redirects to Google, Google
   redirects back to `/api/auth/google/callback`, the server exchanges the
   code, verifies the ID token, and sets a session cookie.

We should use (2):

- No third-party JavaScript, so the strict CSP in `client/nginx.conf`
  (`default-src 'self'`) is untouched — top-level navigations to
  accounts.google.com are not resource loads.
- The session is an HttpOnly cookie minted by our server, never a Google
  token held in JS.
- The same shape (login endpoint → provider redirect → callback → session)
  generalizes to any future OIDC/OAuth provider; only the provider config is
  Google-specific.

The auth endpoints are plain HTTP handlers, not Connect RPCs (OAuth is
redirect-based; it doesn't fit RPC). They live under `/api/auth/...` because
both nginx and the vite dev server already proxy `/api/` to the Go server.

New Go dependencies: `golang.org/x/oauth2` (code exchange) and
`github.com/coreos/go-oidc/v3` (discovery + ID-token verification).

## Data model

New `pb/user.proto`:

```proto
message User {
    string id = 1;                       // our id, from repo.NewId()
    string email = 2;
    string display_name = 3;
    string avatar_url = 4;
    google.protobuf.Timestamp created = 5;
}

// One external login bound to a User. A separate message (rather than
// fields on User) so a user can gain more providers later.
message Identity {
    string provider = 1;                 // "google"
    string subject = 2;                  // provider's stable user id (OIDC `sub`)
    string user_id = 3;
}
```

One new migration in `repo/migrate.go` (append-only, per the architecture):

```sql
CREATE TABLE users (
  proto blob not null,
  id text not null unique primary key,
  created text not null
) strict;

CREATE TABLE identities (
  proto blob not null,
  provider text not null,
  subject text not null,
  user_id text not null references users(id),
  PRIMARY KEY (provider, subject)
) strict;

CREATE TABLE sessions (
  token_hash text not null unique primary key,
  user_id text not null references users(id),
  created text not null,
  expires text not null
) strict;

ALTER TABLE games ADD COLUMN owner_id text null;
```

Notes:

- Following the house style: the proto blob is the source of truth, with a
  few columns replicated for indexing. Users are keyed by our own id, not
  Google's `sub`; the (provider, subject) pair lives in `identities`.
  Login upserts: look up identity → found: load user; not found: create
  user + identity in one transaction. Match by (provider, subject) only —
  never by email, which Google can recycle.
- Sessions are durable state, so they go in sqlite (a server restart must
  not log everyone out). We store only the SHA-256 of the session token, so
  a leaked database copy doesn't yield live sessions. Lifetime ~30 days,
  fixed expiry to start; expired rows deleted lazily on lookup plus an
  opportunistic sweep.
- `games.owner_id` (also a new `owner_id` field on the `Game` proto) records
  who created a game, null for anonymous. This is the minimal hook for
  account-aware features; a server-side "my games" listing is a follow-up,
  not part of this change.
- The app is not deployed, so no data-compat concerns; the migration is
  additive anyway.

## Server changes

New `auth` package:

- `auth.Provider` — small interface (auth URL, code exchange, ID-token
  verification) implemented once for Google via go-oidc, and by a fake in
  tests. Configured from flags/env: `-google-client-id`,
  `-google-client-secret`, `-base-url` (for the redirect URI).
- `GET /api/auth/google/login` — mint a random `state` (short-lived cookie),
  redirect to Google with scopes `openid email profile`.
- `GET /api/auth/google/callback` — check state, exchange code, verify ID
  token, upsert user+identity, create session, set the session cookie,
  redirect to `/`.
- `POST /api/auth/logout` — delete the session row, clear the cookie.
- Cookie: `crossme_session`, HttpOnly, `SameSite=Lax`, `Secure` when the
  request came over https, `Path=/`.

If no Google client ID is configured, the auth routes 404 and the app runs
exactly as today — dev setups don't need Google credentials.

Wiring identity into RPCs:

- The session lookup runs as HTTP middleware wrapped around the Connect
  handler in `cmd/crossme/main.go` (middleware, not a Connect interceptor,
  because interceptors don't see cookies as ergonomically and the auth
  endpoints need the same logic). It resolves the cookie to a `*pb.User`
  and stashes it in the request context; handlers use `auth.UserFromContext`.
  Absent/invalid/expired cookie ⇒ nil user, request proceeds anonymously.
- New RPC `GetSelf(GetSelfArgs) returns (GetSelfResponse { User user })` —
  the cookie is HttpOnly, so this is how the SPA learns who is signed in.
  `user` unset means anonymous.
- `NewGame` stamps `owner_id` from the context when a user is present.
- No RPC *requires* auth; nothing else changes server-side.

CSRF: the session cookie is `SameSite=Lax`, and Connect RPCs are POSTs with
non-form content types that a cross-site form can't produce, so state-changing
RPCs are covered. Logout is the same. The OAuth `state` parameter covers the
callback.

## Client changes

- Regenerate protos (`scripts/gen-proto`); new `User` type and `GetSelf`.
- New `client/src/user.ts`: a `UserContext` + provider that calls `GetSelf`
  once on app load; `useUser()` returns `User | null | "loading"`.
- `Header`: right-aligned account area —
  - anonymous: a "Sign in" link that is a plain `<a href="/api/auth/google/login">`
    (full-page navigation, required for the redirect flow);
  - signed in: avatar/name with a dropdown containing "Sign out", which
    POSTs `/api/auth/logout` and refreshes the user state.
- Everything else (recent games in localStorage, anonymous play, node IDs)
  is untouched. Note: the CRDT `node_id` is a per-browser-session Lamport
  identity and stays completely orthogonal to user identity.

## Deployment/config

- `cmd/crossme` flags (or env): Google client id/secret, external base URL.
  Document in README; the Docker image needs them passed as env/args.
- nginx: no changes needed — `/api/` is already proxied and CSP is
  unaffected. The callback redirect URI must be registered in the Google
  Cloud console for each deployed origin (and `http://localhost:3000` for
  dev).

## Testing

- `repo`: migration round-trip (existing pattern in `migrate_test.go`),
  user/identity upsert semantics, session create/lookup/expiry/delete.
- `auth`: callback handler against a fake `Provider` (state mismatch, new
  user, returning user), middleware behavior for missing/expired/garbage
  cookies.
- `server`: `GetSelf` anonymous vs. signed in; `NewGame` records owner.
- `client`: header rendering in all three user states; `GetSelf` mocked at
  the transport like existing tests.

## Suggested implementation order

1. Protos + migration + repo methods (users, identities, sessions,
   `games.owner_id`).
2. `auth` package: provider abstraction, Google impl, HTTP handlers,
   session middleware; wire into `cmd/crossme`.
3. `GetSelf` RPC + `NewGame` ownership stamping.
4. Client: user context + header UI.
5. Docs (README, ARCHITECTURE note on auth/session handling).

Each step lands as its own commit(s) with tests.

## Open questions

- Session lifetime: fixed 30-day expiry to start, or sliding renewal?
- Should completing/joining a game while signed in also associate it with
  the user (a `game_players` table), or is creator-only ownership enough
  for now? Plan assumes creator-only; multi-player association is a natural
  follow-up alongside server-side recent games.
- ARCHITECTURE.md will need a short new section describing auth; flagging
  since that file is change-controlled.
