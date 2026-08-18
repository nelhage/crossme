package server

import (
	"context"
	"net/http"
	"testing"

	"connectrpc.com/connect"
	"crossme.app/src/pb"
	"crossme.app/src/pb/pbconnect"
)

// cookieTransport attaches a session cookie to every request, standing in
// for a signed-in browser.
type cookieTransport struct {
	base   http.RoundTripper
	cookie *http.Cookie
}

func (c *cookieTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.AddCookie(c.cookie)
	return c.base.RoundTrip(req)
}

// DialAs returns a client whose requests carry a session for a (freshly
// created) user, and that user.
func (ts *TestServer) DialAs(subject string) (pbconnect.CrossMeClient, *pb.User) {
	ts.t.Helper()
	user, err := ts.repo.LoginUser("test", subject, &pb.User{
		Email:       subject + "@example.com",
		DisplayName: subject,
	})
	if err != nil {
		ts.t.Fatalf("LoginUser: %v", err)
	}
	token, err := ts.repo.NewSession(user.Id)
	if err != nil {
		ts.t.Fatalf("NewSession: %v", err)
	}
	client := &http.Client{Transport: &cookieTransport{
		base:   ts.http.Client().Transport,
		cookie: &http.Cookie{Name: "crossme_session", Value: token},
	}}
	return pbconnect.NewCrossMeClient(client, ts.http.URL), user
}

func TestGetSelf(t *testing.T) {
	ctx := context.Background()
	srv := makeServer(t)
	defer srv.Stop()

	// Anonymous callers get an empty response, not an error.
	anon, err := srv.Dial().GetSelf(ctx, connect.NewRequest(&pb.GetSelfArgs{}))
	if err != nil {
		t.Fatalf("anonymous GetSelf: %v", err)
	}
	if anon.Msg.User != nil {
		t.Errorf("anonymous GetSelf returned a user: %v", anon.Msg.User)
	}

	client, user := srv.DialAs("ada")
	self, err := client.GetSelf(ctx, connect.NewRequest(&pb.GetSelfArgs{}))
	if err != nil {
		t.Fatalf("GetSelf: %v", err)
	}
	if got := self.Msg.User; got == nil || got.Id != user.Id || got.Email != user.Email {
		t.Errorf("GetSelf = %v, want %v", got, user)
	}
}

func TestNewGameOwner(t *testing.T) {
	ctx := context.Background()
	srv := makeServer(t)
	defer srv.Stop()

	client, user := srv.DialAs("ada")
	game, err := client.NewGame(ctx, connect.NewRequest(&pb.NewGameArgs{PuzzleId: "puzzle-1"}))
	if err != nil {
		t.Fatalf("NewGame: %v", err)
	}
	if got := game.Msg.Game.OwnerId; got != user.Id {
		t.Errorf("owner %q, want %q", got, user.Id)
	}
	// Ownership is durable, not just stamped on the response.
	stored, err := srv.repo.GameById(game.Msg.Game.Id)
	if err != nil {
		t.Fatalf("GameById: %v", err)
	}
	if stored.OwnerId != user.Id {
		t.Errorf("stored owner %q, want %q", stored.OwnerId, user.Id)
	}

	anon, err := srv.Dial().NewGame(ctx, connect.NewRequest(&pb.NewGameArgs{PuzzleId: "puzzle-1"}))
	if err != nil {
		t.Fatalf("anonymous NewGame: %v", err)
	}
	if got := anon.Msg.Game.OwnerId; got != "" {
		t.Errorf("anonymous game has owner %q", got)
	}
}
