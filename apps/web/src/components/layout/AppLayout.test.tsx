import { ContextType, ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AppLayout } from "./AppLayout";
import { AuthContext } from "../../providers/AuthProvider";

type WrapperProps = {
  children: ReactNode;
};

type AuthValue = NonNullable<ContextType<typeof AuthContext>>;

const createAuthValue = (): AuthValue => ({
  status: "authenticated",
  user: { id: "1", email: "user@example.com", name: "Test User" },
  error: null,
  isAuthenticated: true,
  isProcessing: false,
  accessToken: "token",
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  refresh: vi.fn().mockResolvedValue(undefined)
});

const renderWithProviders = (ui: ReactElement) => {
  const authValue = createAuthValue();

  const Wrapper = ({ children }: WrapperProps) => (
    <MemoryRouter initialEntries={["/"]}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </MemoryRouter>
  );

  return {
    authValue,
    ...render(ui, { wrapper: Wrapper })
  };
};

describe("AppLayout", () => {
  it("toggles the mobile navigation drawer", async () => {
    renderWithProviders(
      <AppLayout>
        <p>Turinys</p>
      </AppLayout>
    );

    const toggle = screen.getByRole("button", { name: /perjungti navigaciją/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    const user = userEvent.setup();
    await user.click(toggle);

    const dialog = await screen.findByRole("dialog", { name: /navigacija/i });
    expect(dialog).toBeInTheDocument();

    const routes = within(dialog).getByRole("link", { name: "Valdymo suvestinė" });
    expect(routes).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const closeButton = within(dialog).getByRole("button", { name: /uždaryti meniu/i });
    await user.click(closeButton);

    expect(screen.queryByRole("dialog", { name: /navigacija/i })).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("provides a visible and clickable logout control on mobile", async () => {
    const { authValue } = renderWithProviders(
      <AppLayout>
        <p>Turinys</p>
      </AppLayout>
    );

    const logoutButton = screen.getByRole("button", { name: /atsijungti/i });
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).not.toHaveClass("hidden");
    expect(logoutButton).toBeEnabled();

    const user = userEvent.setup();
    await user.click(logoutButton);

    expect(authValue.logout).toHaveBeenCalledTimes(1);
  });
});
