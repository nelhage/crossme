package auth

import (
	"context"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

// An ExternalIdentity is what a Provider learns about the user from a
// completed login: a stable (Provider, Subject) pair, plus profile
// claims. Subject is the only thing identity is keyed on; the profile
// fields are display candy that may change between logins.
type ExternalIdentity struct {
	Provider  string
	Subject   string
	Email     string
	Name      string
	AvatarURL string
}

// A Provider implements one external login flow (the authorization-code
// dance). Implementations must verify what they return: Exchange is
// trusted to only ever yield an identity the remote provider attested.
type Provider interface {
	// Name is the provider's stable slug ("google"), used in URLs and
	// stored on identities.
	Name() string
	// AuthCodeURL returns the provider URL to send the browser to.
	AuthCodeURL(state string) string
	// Exchange redeems the callback's authorization code and returns
	// the verified identity.
	Exchange(ctx context.Context, code string) (*ExternalIdentity, error)
}

const GoogleIssuer = "https://accounts.google.com"

type oidcProvider struct {
	name     string
	config   oauth2.Config
	verifier *oidc.IDTokenVerifier
}

// NewGoogle builds the Google Provider. redirectURL must exactly match a
// redirect URI registered for the OAuth client in the Google Cloud
// console (e.g. https://example.com/api/auth/google/callback).
func NewGoogle(ctx context.Context, clientID, clientSecret, redirectURL string) (Provider, error) {
	return newOIDC(ctx, "google", GoogleIssuer, clientID, clientSecret, redirectURL)
}

// newOIDC builds a Provider for any spec-compliant OIDC issuer; adding a
// future provider is a matter of calling this with its issuer URL (or
// implementing Provider directly for non-OIDC OAuth).
func newOIDC(ctx context.Context, name, issuer, clientID, clientSecret, redirectURL string) (Provider, error) {
	provider, err := oidc.NewProvider(ctx, issuer)
	if err != nil {
		return nil, fmt.Errorf("discovering %s OIDC config: %w", name, err)
	}
	return &oidcProvider{
		name: name,
		config: oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  redirectURL,
			Endpoint:     provider.Endpoint(),
			Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
		},
		verifier: provider.Verifier(&oidc.Config{ClientID: clientID}),
	}, nil
}

func (p *oidcProvider) Name() string { return p.name }

func (p *oidcProvider) AuthCodeURL(state string) string {
	return p.config.AuthCodeURL(state)
}

func (p *oidcProvider) Exchange(ctx context.Context, code string) (*ExternalIdentity, error) {
	token, err := p.config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("exchanging code: %w", err)
	}
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, fmt.Errorf("token response had no id_token")
	}
	idToken, err := p.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, fmt.Errorf("verifying id_token: %w", err)
	}
	var claims struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return nil, fmt.Errorf("parsing id_token claims: %w", err)
	}
	return &ExternalIdentity{
		Provider:  p.name,
		Subject:   idToken.Subject,
		Email:     claims.Email,
		Name:      claims.Name,
		AvatarURL: claims.Picture,
	}, nil
}
