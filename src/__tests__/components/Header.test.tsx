/**
 * @file Header.test.tsx
 * @description This file contains the test suite for the Header component. It tests that the page title and user initials render, and that clicking the avatar toggles the dropdown with user info and calls logout.
 * @lastEdited 2025-05-27
 * @author Leon Blanga
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "../../components/Header";
import { useAuth } from "../../hooks/auth/authContext";
import { vi, Mock } from "vitest";

// Mocks
vi.mock("../../hooks/auth/authContext", () => ({
  useAuth: vi.fn(),
}));

describe("Header", () => {
  const mockedUseAuth = useAuth as unknown as Mock;
  const fakeAuth = {
    authState: {
      userName: "Leon",
      userLastName: "Blanga",
      userEmail: "leon@example.com",
      userRole: "Admin"
    },
    handleLogout: vi.fn()
  };

  const fakeAuthEmpty = {
    authState: {
      userName: "",
      userLastName: "",
      userEmail: "",
      userRole: ""
    },
    handleLogout: vi.fn()
  };

  beforeEach(() => {
    mockedUseAuth.mockReturnValue(fakeAuth);
  });

  it("muestra el título de la página y las iniciales del usuario", () => {
    render(<Header onMenuClick={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Monarca",
    );
    expect(screen.getByRole("button", { name: "LB" })).toBeInTheDocument();
  });

  it("no falla si faltan los nombres (error previo de undefined)", () => {
    mockedUseAuth.mockReturnValue(fakeAuthEmpty);
    render(<Header onMenuClick={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Monarca",
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("al hacer clic muestra el menú con datos y botón de logout", async () => {
    render(<Header onMenuClick={vi.fn()} />);
    const btn = screen.getByRole("button", { name: "LB" });
    await userEvent.click(btn);

    // Nombre completo, email y rol
    expect(screen.getByText("Leon Blanga")).toBeInTheDocument();
    expect(screen.getByText("leon@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();

    const logout = screen.getByRole("button", { name: "Cerrar Sesión" });
    expect(logout).toBeInTheDocument();

    await userEvent.click(logout);
    expect(fakeAuth.handleLogout).toHaveBeenCalled();
  });
});
