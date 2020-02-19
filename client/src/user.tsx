import React, { useContext } from "react";

export const CurrentUser = React.createContext<null | gapi.auth2.GoogleUser>(
  null
);

export function useCurrentUser(): null | gapi.auth2.GoogleUser {
  return useContext(CurrentUser);
}
