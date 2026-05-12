/**
 * File: RefundsAcceptance.test.tsx
 * Description: Test suite for the RefundsAcceptance page component
 * Last edited: 16/05/2025
 * Author: Gabriel Edid Harari
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RefundsAcceptance from "../../pages/Refunds/RefundsAcceptance";
import React from "react";
import { postRequest } from "../../utils/apiService";

vi.mock("../../hooks/app/appContext", () => ({
  useApp: () => ({
    handleVisitPage: vi.fn(),
    tutorial: false,
  }),
}));

// Mock router hooks
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "123" }),
    useNavigate: () => mockNavigate,
  };
});

// Mock API services to return test data immediately
vi.mock("../../utils/apiService", () => ({
  getRequest: vi.fn(() =>
    Promise.resolve({
      id: "123",
      admin: { name: "John", last_name: "Doe" },
      destination: { city: "NYC" },
      requests_destinations: [
        {
          destination: { city: "Chicago" },
          arrival_date: "2024-01-10",
          departure_date: "2024-01-12",
        },
        {
          destination: { city: "Boston" },
          arrival_date: "2024-01-12",
          departure_date: "2024-01-14",
        },
      ],
      createdAt: "2024-01-01",
      advance_money: 1000,
      motive: "Business Trip",
      status: "pending",
      requirements: "None",
      priority: "High",
      vouchers: [
        {
          id: "v1",
          file_url_pdf: "file1.pdf",
          file_url_xml: "file1.xml",
          status: "comprobante_pendiente",
          class: "expense",
          amount: 500,
          date: "2024-01-01",
        },
        {
          id: "v2",
          file_url_pdf: "file2.pdf",
          file_url_xml: "file2.xml",
          status: "comprobante_aprobado",
          class: "expense",
          amount: 300,
          date: "2024-01-02",
        },
      ],
    }),
  ),
  postRequest: vi.fn(() =>
    Promise.resolve({
      policy_summary: {
        violations: [],
      },
    }),
  ),
  patchRequest: vi.fn(() => Promise.resolve({})),
}));

// Mock utility functions
vi.mock("../../utils/formatMoney", () => ({
  default: (value: number) => `$${value.toFixed(2)}`,
}));

vi.mock("../../utils/formatDate", () => ({
  default: (_date: string) => "2024-01-01",
}));

// Mock components
vi.mock("../../components/GoBack", () => ({
  default: () => <div data-testid="go-back">Go Back</div>,
}));

vi.mock("../../components/Refunds/FilePreviewer", () => ({
  default: ({ file, fileIndex }: any) => (
    <div data-testid={`file-previewer-${fileIndex}`}>
      File: {file?.id || "unknown"}
    </div>
  ),
}));

// Mock Swiper
vi.mock("swiper/react", () => ({
  Swiper: ({ children, onBeforeInit }: any) => {
    React.useEffect(() => {
      if (onBeforeInit) {
        const mockSwiper = {
          params: { navigation: { prevEl: null, nextEl: null } },
        };
        onBeforeInit(mockSwiper);
      }
    }, []);

    return <div data-testid="swiper">{children}</div>;
  },
  SwiperSlide: ({ children }: any) => (
    <div data-testid="swiper-slide">{children}</div>
  ),
}));

vi.mock("swiper/modules", () => ({
  Navigation: {},
  Pagination: {},
}));

// Mock react-toastify
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn() },
}));

describe("RefundsAcceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
  };

  it("renders the component with basic elements", async () => {
    renderWithRouter(<RefundsAcceptance />);

    expect(screen.getByTestId("go-back")).toBeInTheDocument();

    await waitFor(
      () => {
        // Use getByText instead of regex to match exact rendered text
        expect(
          screen.getByText("Información de Solicitud:"),
        ).toBeInTheDocument();
        expect(screen.getByText("123")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(screen.getByText(/Información importante/i)).toBeInTheDocument();
  });

  it("renders form fields with correct labels", async () => {
    renderWithRouter(<RefundsAcceptance />);

    await waitFor(
      () => {
        expect(screen.getByLabelText("ID solicitud")).toBeInTheDocument();
        expect(screen.getByLabelText("Aprobador")).toBeInTheDocument();
        expect(screen.getByLabelText("Ciudad de Origen")).toBeInTheDocument();
        expect(screen.getByLabelText("Destinos")).toBeInTheDocument();
        expect(screen.getByLabelText("Motivo")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("displays vouchers in swiper", async () => {
    renderWithRouter(<RefundsAcceptance />);

    await waitFor(
      () => {
        expect(screen.getByTestId("swiper")).toBeInTheDocument();
        expect(screen.getAllByTestId(/swiper-slide/)).toHaveLength(2);
      },
      { timeout: 3000 },
    );
  });

  it("renders approve/deny buttons for pending vouchers", async () => {
    renderWithRouter(<RefundsAcceptance />);

    await waitFor(
      () => {
        const approveButtons = screen.getAllByText("Aprobar");
        const denyButtons = screen.getAllByText("Denegar");

        expect(approveButtons.length).toBeGreaterThan(0);
        expect(denyButtons.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
  });

  it("displays navigation buttons", async () => {
    renderWithRouter(<RefundsAcceptance />);

    await waitFor(
      () => {
        expect(screen.getByText("Anterior")).toBeInTheDocument();
        expect(screen.getByText("Siguiente")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("displays total amounts correctly", async () => {
    renderWithRouter(<RefundsAcceptance />);

    await waitFor(
      () => {
        expect(
          screen.getByLabelText("Total de Comprobantes"),
        ).toBeInTheDocument();

        // There are 2 "Anticipo" labels (one in main form, one in totals section)
        const anticipoElements = screen.getAllByLabelText("Anticipo");
        expect(anticipoElements).toHaveLength(2);

        // Only 1 "Total" label is found due to duplicate IDs
        const totalElements = screen.getAllByLabelText("Total");
        expect(totalElements).toHaveLength(1);
      },
      { timeout: 3000 },
    );
  });

  it("disables complete button when vouchers are pending", async () => {
    renderWithRouter(<RefundsAcceptance />);

    await waitFor(
      () => {
        const completeButton = screen.getByText("Completar Comprobación");
        expect(completeButton).toBeDisabled();
      },
      { timeout: 3000 },
    );
  });

  it("handles form input display", async () => {
    renderWithRouter(<RefundsAcceptance />);

    await waitFor(
      () => {
        const idInput = screen.getByLabelText(
          "ID solicitud",
        ) as HTMLInputElement;
        expect(idInput.value).toBe("123");
        expect(idInput.readOnly).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it("muestra violaciones de ventana de viaje solo para el voucher preview correspondiente", async () => {
    vi.mocked(postRequest).mockResolvedValueOnce({
      policy_summary: {
        violations: [
          {
            policy_code: "VOUCHER_DATE_WITHIN_TRIP_WINDOW",
            message: "Comprobante fuera del periodo del viaje",
            severity: "BLOCKING",
            evaluated_value: {
              out_of_window_voucher_ids: ["preview-2"],
              trip_start_date: "2024-01-01",
              trip_end_date: "2024-01-05",
            },
          },
        ],
      },
    });

    renderWithRouter(<RefundsAcceptance />);

    await waitFor(() => {
      expect(screen.getByText("Comprobante fuera del periodo del viaje")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Observaciones de políticas")).toHaveLength(1);
  });

  it("agrega validación de respaldo de ventana de viaje cuando el backend no la regresa", async () => {
    vi.mocked(postRequest).mockResolvedValueOnce({
      policy_summary: {
        violations: [
          {
            policy_code: "LT",
            message: "Regla violada: LT con valor 50",
            severity: "WARNING",
            evaluated_value: {
              amount: 1,
              operator: "LT",
              threshold: 50,
              currency: "MXN",
            },
          },
        ],
      },
    });

    renderWithRouter(<RefundsAcceptance />);

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Comprobante fuera del periodo del viaje (validación de respaldo).",
        ).length,
      ).toBeGreaterThan(0);
    });
  });
});
