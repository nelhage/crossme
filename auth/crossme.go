package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// CrossMeProviderName is the slug of the provider that signs a preview
// instance's users in through production; see broker.go for the protocol.
const CrossMeProviderName = "crossme"

// A TokenSource produces the client assertion a preview presents to
// production when redeeming a code: proof of which preview it is, minted
// for the given audience. On Fly that is the Machine's OIDC token
// (fly.OIDCToken).
type TokenSource func(ctx context.Context, audience string) (string, error)

// crossmeProvider is the preview-instance side of preview login. Unlike
// the OIDC providers, the identity it yields is not its own: production
// reports which external identities (e.g. Google subjects) the user has,
// and we return the first, so that the login lands on the same user row
// the preview inherited from production's snapshot.
type crossmeProvider struct {
	issuer      string // production's base URL
	redirectURL string
	tokens      TokenSource
	client      *http.Client
}

// NewCrossMe builds the provider for a preview instance. issuer is the
// production deployment's base URL (https://crossme.app); redirectURL is
// this instance's own callback, which production must recognize as a
// preview's.
func NewCrossMe(issuer, redirectURL string, tokens TokenSource) Provider {
	return &crossmeProvider{
		issuer:      strings.TrimSuffix(issuer, "/"),
		redirectURL: redirectURL,
		tokens:      tokens,
		client:      &http.Client{Timeout: 15 * time.Second},
	}
}

func (p *crossmeProvider) Name() string { return CrossMeProviderName }

func (p *crossmeProvider) AuthCodeURL(state string) string {
	q := url.Values{
		"redirect_uri": {p.redirectURL},
		"state":        {state},
	}
	return p.issuer + brokerAuthorizePath + "?" + q.Encode()
}

func (p *crossmeProvider) Exchange(ctx context.Context, code string) (*ExternalIdentity, error) {
	assertion, err := p.tokens(ctx, p.issuer)
	if err != nil {
		return nil, fmt.Errorf("getting client assertion: %w", err)
	}
	form := url.Values{
		"code":             {code},
		"redirect_uri":     {p.redirectURL},
		"client_assertion": {assertion},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.issuer+brokerTokenPath,
		strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("redeeming code: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("redeeming code: %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	var parsed brokerTokenResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("parsing token response: %w", err)
	}
	if len(parsed.Identities) == 0 {
		return nil, fmt.Errorf("token response names no identities")
	}
	ident := parsed.Identities[0]
	if ident.Provider == "" || ident.Subject == "" || ident.Provider == CrossMeProviderName {
		return nil, fmt.Errorf("token response has malformed identity %+v", ident)
	}
	return &ExternalIdentity{
		Provider:  ident.Provider,
		Subject:   ident.Subject,
		Email:     parsed.User.Email,
		Name:      parsed.User.DisplayName,
		AvatarURL: parsed.User.AvatarURL,
	}, nil
}
