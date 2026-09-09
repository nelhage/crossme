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

The app is then at `http://localhost:4000`. Run like this, a container
starts on an empty database that dies with it, and with no way to sign
in. Google login can be enabled exactly as in production, with
`CROSSME_GOOGLE_CLIENT_ID`, `CROSSME_GOOGLE_CLIENT_SECRET` and
`CROSSME_BASE_URL` (the last being the URL the browser reaches the
preview at, whose `/api/auth/google/callback` must be a registered
redirect URI); the deployed previews sign in through production instead,
see below.

Every pull request is deployed as a preview from this image by
`.github/workflows/preview.yml`, as a Fly.io app named
`crossme-pr-<number>` (config in `fly.toml`), destroyed when the PR
closes. The workflow needs an org-scoped Fly API token in the
`FLY_API_TOKEN` repository secret.

A preview starts from a snapshot of the production database rather than
empty: on first boot, if the database file doesn't exist, the server
downloads `-seed-from` / `CROSSME_SEED_FROM` (a `gs://` URL, set in
`fly.toml`; a `.zst` object is decompressed) and starts from that. Reading
the bucket is keyless. Every Fly Machine can mint an OIDC token about
itself, and a Google Cloud Workload Identity Federation provider trusts
those tokens for apps named `crossme-pr-*`; the server exchanges the Fly
token for a Google access token and fetches the object. The provider's
full resource name is passed as `-gcp-identity-provider` /
`CROSSME_GCP_IDENTITY_PROVIDER`, which the workflow takes from the
`GCP_WORKLOAD_IDENTITY_PROVIDER` repository variable:

    //iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/fly-io/providers/fly-io

That provider was created against issuer `https://oidc.fly.io/nelson-elhage`
(the Fly org's real slug; the CLI shows a personal org as `personal`, but
tokens carry the slug)
with allowed audience `crossme-preview` (the audience the server
requests) and an attribute condition restricting it to `crossme-pr-*`
apps, and the pool was granted `roles/storage.objectViewer` on the
snapshot's prefix. A seeding failure is fatal, so a misconfigured
preview shows up as an unhealthy Machine with the reason in its logs,
not as a working app with no data.

Preview login
-------------

Since a preview's users are production's users, a preview signs people in
through production rather than Google (whose redirect URIs would have to
be registered per preview host). `CROSSME_LOGIN_VIA=https://crossme.app`
in `fly.toml` enables a `crossme` login provider on the preview: "Sign
in" sends the browser to production's `/api/auth/preview/authorize`,
which signs the user in there if needed, asks them to confirm that the
named preview may learn who they are, and redirects back with a one-shot
code. The preview redeems the code at production's
`/api/auth/preview/token` for the user's external identities and logs
them in as it would after a Google login, landing on the user row it
inherited from the snapshot. Nothing the preview receives works against
production. See `auth/broker.go` for the protocol and its checks.

Production enables its side with `CROSSME_PREVIEW_LOGIN_ISSUER` set to
the Fly org's OIDC issuer, `https://oidc.fly.io/nelson-elhage`, and only
deals with apps matching `CROSSME_PREVIEW_LOGIN_APPS` (default
`crossme-pr-*`) at `https://<app>.fly.dev`. Redeeming a code requires the
preview Machine's own Fly OIDC token, minted for audience
`https://crossme.app` (production's `CROSSME_BASE_URL`) and naming the
same app the code was issued to; production verifies it against the
issuer's published keys. That is what stops anyone from registering a
free `crossme-pr-N` app name of their own and collecting codes. No
secret is shared with previews, and nothing else needs configuring on
either side.
