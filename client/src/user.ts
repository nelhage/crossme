import { createContext, useContext } from "react";

import type { User } from "./pb/user_pb";

// The session lives in an HttpOnly cookie the page can't read, so "who am
// I?" is a question for the server: UserProvider (user_provider.tsx) asks
// once via GetSelf when the app loads and holds the answer here. Signing
// in is a full-page redirect through /api/auth/, which reloads the app
// and re-asks.

export interface UserState {
  // The signed-in user; null when anonymous (including while the initial
  // GetSelf is still in flight).
  user: User | null;
  // The login providers the server offers, by the slug in their
  // /api/auth/{provider}/login URL. Empty while GetSelf is in flight and
  // on a server with accounts turned off, in which case there is nothing
  // to sign in with.
  loginProviders: string[];
  // Drop the signed-in user after a logout, without a reload.
  clearUser: () => void;
}

export const UserContext = createContext<UserState>({
  user: null,
  loginProviders: [],
  clearUser: () => {},
});

// The URL that starts a login with a provider: a full-page navigation,
// not a router link.
export function loginUrl(provider: string): string {
  return `/api/auth/${provider}/login`;
}

// What to call each provider when there is more than one to choose from.
// "crossme" is a preview instance signing in through the production site.
const providerLabels: Record<string, string> = {
  google: "Google",
  crossme: "crossme.app",
};

export function providerLabel(provider: string): string {
  return providerLabels[provider] ?? provider;
}

export function useUser(): UserState {
  return useContext(UserContext);
}
