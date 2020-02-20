import React, { useContext } from "react";

export interface GoogleSession {
  type: "google";
  user_id: string;
  name: string;
  auth: gapi.auth2.AuthResponse;
}

export interface AnonymousSession {
  type: "anonymous";
  user_id: string;
}

export type Session = GoogleSession | AnonymousSession;

export const CurrentUser = React.createContext<null | Session>(null);

export function useCurrentUser(): null | Session {
  return useContext(CurrentUser);
}
