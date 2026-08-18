package repo

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"crossme.app/src/pb"
)

// Sessions expire after SessionLifetime of *inactivity*: any use of a
// session whose expiry has drifted more than sessionRenewEvery below the
// full lifetime pushes the expiry back out (a "sliding" expiry). The
// throttle keeps an active user down to roughly one renewal write per day
// instead of one per RPC.
const (
	SessionLifetime   = 30 * 24 * time.Hour
	sessionRenewEvery = 24 * time.Hour
)

// NewSession creates a session for a user and returns the bearer token to
// hand to the client. Only a hash of the token is stored: the returned
// value is unrecoverable from the database.
func (r *Repository) NewSession(userID string) (string, error) {
	var raw [32]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return "", fmt.Errorf("generating session token: %w", err)
	}
	token := hex.EncodeToString(raw[:])

	now := time.Now()
	if _, err := r.db.NamedExec(sql_insert_session, &insert_session_args{
		TokenHash: hashToken(token),
		UserId:    userID,
		Created:   formatTime(now),
		Expires:   formatTime(now.Add(SessionLifetime)),
	}); err != nil {
		return "", err
	}
	return token, nil
}

// SessionUser resolves a session token to its user, applying the sliding
// expiry described above. `renewed` reports that the expiry was pushed
// out, so the caller can refresh the cookie's own lifetime to match. An
// unknown or expired token yields ErrNoSuchSession.
func (r *Repository) SessionUser(token string) (user *pb.User, renewed bool, err error) {
	hash := hashToken(token)

	var row struct {
		UserId  string `db:"user_id"`
		Expires string `db:"expires"`
	}
	rows, err := r.db.NamedQuery(sql_query_session, session_args{TokenHash: hash})
	if err != nil {
		return nil, false, err
	}
	defer rows.Close()
	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, false, err
		}
		return nil, false, ErrNoSuchSession
	}
	if err := rows.StructScan(&row); err != nil {
		return nil, false, err
	}
	rows.Close()

	expires, err := parseTime(row.Expires)
	if err != nil {
		return nil, false, fmt.Errorf("session %s: bad expiry %q: %w", hash, row.Expires, err)
	}
	now := time.Now()
	if !now.Before(expires) {
		_ = r.DeleteSession(token)
		return nil, false, ErrNoSuchSession
	}

	if expires.Before(now.Add(SessionLifetime - sessionRenewEvery)) {
		if _, err := r.db.NamedExec(sql_update_session_expires, &update_session_expires_args{
			TokenHash: hash,
			Expires:   formatTime(now.Add(SessionLifetime)),
		}); err != nil {
			return nil, false, err
		}
		renewed = true
	}

	u, err := r.UserById(row.UserId)
	if err != nil {
		return nil, false, err
	}
	return u, renewed, nil
}

// DeleteSession forgets a session (logout). Deleting a session that does
// not exist is not an error.
func (r *Repository) DeleteSession(token string) error {
	_, err := r.db.NamedExec(sql_delete_session, &session_args{
		TokenHash: hashToken(token),
	})
	return err
}

// SweepSessions deletes every expired session. Expired sessions are
// already unusable (SessionUser checks); this just keeps the table from
// accumulating dead rows.
func (r *Repository) SweepSessions() error {
	_, err := r.db.NamedExec(sql_delete_expired_sessions, &delete_expired_sessions_args{
		Now: formatTime(time.Now()),
	})
	return err
}

func hashToken(token string) string {
	csum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(csum[:])
}
