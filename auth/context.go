// Package auth implements optional user accounts: OIDC login (Google
// today), cookie sessions, and the middleware that resolves a session to
// a user. Everything here is additive — a request with no session is
// simply anonymous, and every handler keeps working.
package auth

import (
	"context"

	"crossme.app/src/pb"
)

type contextKey struct{}

// UserFromContext returns the signed-in user attached by Middleware, or
// nil for an anonymous request.
func UserFromContext(ctx context.Context) *pb.User {
	user, _ := ctx.Value(contextKey{}).(*pb.User)
	return user
}

func withUser(ctx context.Context, user *pb.User) context.Context {
	return context.WithValue(ctx, contextKey{}, user)
}
