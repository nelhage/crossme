import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { User } from "./pb/user_pb";
import { useClient } from "./rpc";
import { UserContext } from "./user";

// Fetches the signed-in user (if any) once on mount and provides it to
// the tree; see user.ts for the context itself.
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const client = useClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    client.getSelf({}).then(
      (resp) => {
        if (!cancelled) {
          setUser(resp.user ?? null);
        }
      },
      () => {
        // Accounts are a convenience; if GetSelf fails, we're anonymous.
      }
    );
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <UserContext value={{ user, clearUser: () => setUser(null) }}>
      {children}
    </UserContext>
  );
};
