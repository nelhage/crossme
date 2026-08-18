package repo

import (
	"errors"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"google.golang.org/protobuf/proto"

	"crossme.app/src/pb"
)

func openTestRepo(t *testing.T) *Repository {
	t.Helper()
	repo, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	t.Cleanup(func() { repo.Close() })
	return repo
}

func TestLoginUser(t *testing.T) {
	t.Parallel()
	repo := openTestRepo(t)

	profile := &pb.User{
		Email:       "ada@example.com",
		DisplayName: "Ada Lovelace",
		AvatarUrl:   "https://example.com/ada.png",
	}
	user, err := repo.LoginUser("google", "sub-ada", profile)
	if err != nil {
		t.Fatalf("LoginUser: %v", err)
	}
	if user.Id == "" {
		t.Errorf("new user has no id")
	}
	if user.Created == nil {
		t.Errorf("new user has no created timestamp")
	}
	if user.Email != profile.Email ||
		user.DisplayName != profile.DisplayName ||
		user.AvatarUrl != profile.AvatarUrl {
		t.Errorf("profile not copied: %v", user)
	}

	// A second login with the same identity is the same user.
	again, err := repo.LoginUser("google", "sub-ada", profile)
	if err != nil {
		t.Fatalf("LoginUser again: %v", err)
	}
	if !proto.Equal(again, user) {
		t.Errorf("returning login: got %v, want %v", again, user)
	}

	// Changed provider claims are refreshed onto the same user, and the
	// refresh is persisted.
	updated, err := repo.LoginUser("google", "sub-ada", &pb.User{
		Email:       "countess@example.com",
		DisplayName: "Countess of Lovelace",
	})
	if err != nil {
		t.Fatalf("LoginUser with new profile: %v", err)
	}
	if updated.Id != user.Id {
		t.Errorf("profile refresh created a new user: %s != %s", updated.Id, user.Id)
	}
	stored, err := repo.UserById(user.Id)
	if err != nil {
		t.Fatalf("UserById: %v", err)
	}
	if stored.Email != "countess@example.com" ||
		stored.DisplayName != "Countess of Lovelace" ||
		stored.AvatarUrl != "" {
		t.Errorf("refresh not persisted: %v", stored)
	}

	// Same subject at a different provider is a different person: only
	// the (provider, subject) pair identifies anyone.
	other, err := repo.LoginUser("example", "sub-ada", profile)
	if err != nil {
		t.Fatalf("LoginUser other provider: %v", err)
	}
	if other.Id == user.Id {
		t.Errorf("distinct providers shared a user")
	}

	if _, err := repo.UserById("no-such-id"); !errors.Is(err, ErrNoSuchUser) {
		t.Errorf("UserById(bogus) = %v, want ErrNoSuchUser", err)
	}
}

func TestSessionLifecycle(t *testing.T) {
	t.Parallel()
	repo := openTestRepo(t)

	user, err := repo.LoginUser("google", "sub-1", &pb.User{Email: "u@example.com"})
	if err != nil {
		t.Fatalf("LoginUser: %v", err)
	}

	token, err := repo.NewSession(user.Id)
	if err != nil {
		t.Fatalf("NewSession: %v", err)
	}
	if token == "" {
		t.Fatalf("empty session token")
	}

	// The raw token must not appear in the database.
	var n int
	if err := repo.db.Get(&n, "SELECT count(*) FROM sessions WHERE token_hash = ?", token); err != nil {
		t.Fatalf("count: %v", err)
	}
	if n != 0 {
		t.Errorf("session token stored unhashed")
	}

	got, renewed, err := repo.SessionUser(token)
	if err != nil {
		t.Fatalf("SessionUser: %v", err)
	}
	if got.Id != user.Id {
		t.Errorf("session resolved to %q, want %q", got.Id, user.Id)
	}
	if renewed {
		t.Errorf("fresh session was renewed")
	}

	if _, _, err := repo.SessionUser("bogus-token"); !errors.Is(err, ErrNoSuchSession) {
		t.Errorf("SessionUser(bogus) = %v, want ErrNoSuchSession", err)
	}

	if err := repo.DeleteSession(token); err != nil {
		t.Fatalf("DeleteSession: %v", err)
	}
	if _, _, err := repo.SessionUser(token); !errors.Is(err, ErrNoSuchSession) {
		t.Errorf("SessionUser after delete = %v, want ErrNoSuchSession", err)
	}
	// Deleting again is a no-op, not an error.
	if err := repo.DeleteSession(token); err != nil {
		t.Errorf("DeleteSession twice: %v", err)
	}
}

// setSessionExpiry rewrites a session's expiry, standing in for the
// passage of time.
func setSessionExpiry(t *testing.T, r *Repository, token string, expires time.Time) {
	t.Helper()
	res, err := r.db.Exec("UPDATE sessions SET expires = ? WHERE token_hash = ?",
		formatTime(expires), hashToken(token))
	if err != nil {
		t.Fatalf("set expiry: %v", err)
	}
	if n, _ := res.RowsAffected(); n != 1 {
		t.Fatalf("set expiry touched %d rows", n)
	}
}

func TestSessionExpiry(t *testing.T) {
	t.Parallel()
	repo := openTestRepo(t)

	user, err := repo.LoginUser("google", "sub-1", &pb.User{})
	if err != nil {
		t.Fatalf("LoginUser: %v", err)
	}
	token, err := repo.NewSession(user.Id)
	if err != nil {
		t.Fatalf("NewSession: %v", err)
	}

	setSessionExpiry(t, repo, token, time.Now().Add(-time.Minute))
	if _, _, err := repo.SessionUser(token); !errors.Is(err, ErrNoSuchSession) {
		t.Fatalf("expired session resolved: %v", err)
	}
	// The dead row was reaped on lookup.
	var n int
	if err := repo.db.Get(&n, "SELECT count(*) FROM sessions"); err != nil {
		t.Fatalf("count: %v", err)
	}
	if n != 0 {
		t.Errorf("expired session row survived lookup")
	}
}

func TestSessionSlidingRenewal(t *testing.T) {
	t.Parallel()
	repo := openTestRepo(t)

	user, err := repo.LoginUser("google", "sub-1", &pb.User{})
	if err != nil {
		t.Fatalf("LoginUser: %v", err)
	}
	token, err := repo.NewSession(user.Id)
	if err != nil {
		t.Fatalf("NewSession: %v", err)
	}

	// A session used two renew-intervals into its life is stale enough
	// to renew.
	stale := time.Now().Add(SessionLifetime - 2*sessionRenewEvery)
	setSessionExpiry(t, repo, token, stale)

	_, renewed, err := repo.SessionUser(token)
	if err != nil {
		t.Fatalf("SessionUser: %v", err)
	}
	if !renewed {
		t.Fatalf("stale session was not renewed")
	}
	var expiresStr string
	if err := repo.db.Get(&expiresStr, "SELECT expires FROM sessions WHERE token_hash = ?", hashToken(token)); err != nil {
		t.Fatalf("select expires: %v", err)
	}
	expires, err := parseTime(expiresStr)
	if err != nil {
		t.Fatalf("parse expires: %v", err)
	}
	if !expires.After(stale) {
		t.Errorf("renewal did not extend expiry: %v <= %v", expires, stale)
	}

	// Using it again right away is inside the throttle window: no write.
	_, renewed, err = repo.SessionUser(token)
	if err != nil {
		t.Fatalf("SessionUser: %v", err)
	}
	if renewed {
		t.Errorf("just-renewed session renewed again")
	}
}

func TestSweepSessions(t *testing.T) {
	t.Parallel()
	repo := openTestRepo(t)

	user, err := repo.LoginUser("google", "sub-1", &pb.User{})
	if err != nil {
		t.Fatalf("LoginUser: %v", err)
	}
	live, err := repo.NewSession(user.Id)
	if err != nil {
		t.Fatalf("NewSession: %v", err)
	}
	dead, err := repo.NewSession(user.Id)
	if err != nil {
		t.Fatalf("NewSession: %v", err)
	}
	setSessionExpiry(t, repo, dead, time.Now().Add(-time.Minute))

	if err := repo.SweepSessions(); err != nil {
		t.Fatalf("SweepSessions: %v", err)
	}
	var n int
	if err := repo.db.Get(&n, "SELECT count(*) FROM sessions"); err != nil {
		t.Fatalf("count: %v", err)
	}
	if n != 1 {
		t.Errorf("%d sessions after sweep, want 1", n)
	}
	if _, _, err := repo.SessionUser(live); err != nil {
		t.Errorf("live session swept: %v", err)
	}
}
