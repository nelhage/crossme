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
  // Drop the signed-in user after a logout, without a reload.
  clearUser: () => void;
}

export const UserContext = createContext<UserState>({
  user: null,
  clearUser: () => {},
});

export function useUser(): UserState {
  return useContext(UserContext);
}
