import React, { useContext } from "react";

import { CrossMeClient } from "./pb/CrossmeServiceClientPb";

export const ClientContext = React.createContext<CrossMeClient>(
  (null as unknown) as CrossMeClient
);

export function useClient(): CrossMeClient {
  return useContext(ClientContext);
}
