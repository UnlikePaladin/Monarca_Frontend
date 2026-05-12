import "@testing-library/jest-dom";
import { vi } from "vitest";

/**
 * Default App context for tests: pages/components that call useApp() without wrapping AppProvider.
 */
vi.mock("../hooks/app/appContext", () => ({
  AppProvider: ({ children }: { children: unknown }) => children,
  useApp: () => ({
    pageTitle: "Sin título",
    setPageTitle: vi.fn(),
    handleVisitPage: vi.fn(),
    tutorial: false,
    setTutorial: vi.fn(),
  }),
}));
