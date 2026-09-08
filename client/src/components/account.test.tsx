import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { create } from "@bufbuild/protobuf";

import { GetSelfResponseSchema } from "../pb/crossme_pb";
import { ClientContext, type CrossMeClient } from "../rpc";
import { UserProvider } from "../user_provider";
import { Account } from "./account";

function fakeClient(getSelf: CrossMeClient["getSelf"]): CrossMeClient {
  return { getSelf } as unknown as CrossMeClient;
}

function renderAccount(getSelf: CrossMeClient["getSelf"]) {
  render(
    <ClientContext.Provider value={fakeClient(getSelf)}>
      <UserProvider>
        <Account />
      </UserProvider>
    </ClientContext.Provider>
  );
}

it("offers Google sign-in to anonymous visitors", async () => {
  const getSelf = vi
    .fn()
    .mockResolvedValue(
      create(GetSelfResponseSchema, { loginProviders: ["google"] })
    );
  renderAccount(getSelf);

  const link = await screen.findByRole("link", { name: "Sign in" });
  expect(link).toHaveAttribute("href", "/api/auth/google/login");
});

it("links to whichever provider the server offers", async () => {
  // A preview instance signs in through production instead of Google.
  const getSelf = vi
    .fn()
    .mockResolvedValue(
      create(GetSelfResponseSchema, { loginProviders: ["crossme"] })
    );
  renderAccount(getSelf);

  const link = await screen.findByRole("link", { name: "Sign in" });
  expect(link).toHaveAttribute("href", "/api/auth/crossme/login");
});

it("names the providers when there is a choice", async () => {
  const getSelf = vi
    .fn()
    .mockResolvedValue(
      create(GetSelfResponseSchema, { loginProviders: ["crossme", "google"] })
    );
  renderAccount(getSelf);

  const viaProd = await screen.findByRole("link", {
    name: "Sign in with crossme.app",
  });
  expect(viaProd).toHaveAttribute("href", "/api/auth/crossme/login");
  expect(
    screen.getByRole("link", { name: "Sign in with Google" })
  ).toHaveAttribute("href", "/api/auth/google/login");
});

it("offers no sign-in when the server has no login providers", async () => {
  const getSelf = vi.fn().mockResolvedValue(create(GetSelfResponseSchema, {}));
  renderAccount(getSelf);

  await waitFor(() => expect(getSelf).toHaveBeenCalled());
  expect(screen.queryByRole("link")).toBeNull();
});

it("shows the signed-in user, and signs them out", async () => {
  const getSelf = vi.fn().mockResolvedValue(
    create(GetSelfResponseSchema, {
      user: {
        id: "user-1",
        email: "ada@example.com",
        displayName: "Ada Lovelace",
      },
      loginProviders: ["google"],
    })
  );
  const fetch = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 204 }));
  try {
    renderAccount(getSelf);

    const toggle = await screen.findByRole("button", { name: /Ada Lovelace/ });
    fireEvent.click(toggle);
    expect(screen.getByText("ada@example.com")).toBeVisible();

    fireEvent.click(screen.getByText("Sign out"));
    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    // Locally signed out without a reload.
    expect(await screen.findByRole("link", { name: "Sign in" })).toBeVisible();
  } finally {
    fetch.mockRestore();
  }
});
