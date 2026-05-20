// src/components/travel-requests/__tests__/TravelRequestForm.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TravelRequestForm from "../../../components/travel-requests/TravelRequestForm";
import { useNavigate } from "react-router-dom";
import { useDestinations } from "../../../hooks/destinations/useDestinations";
import { useCreateTravelRequest } from "../../../hooks/requests/useCreateRequest";
import { useUpdateTravelRequest } from "../../../hooks/requests/useUpdateRequest";

/* ---------------------------------------------------------------- */
/*  Test setup / mocks                                              */
/* ---------------------------------------------------------------- */

// Polyfill ResizeObserver for jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserverMock;

// Mock external hooks
vi.mock("react-router-dom", () => ({ useNavigate: vi.fn() }));
vi.mock("../../../hooks/destinations/useDestinations", () => ({
  useDestinations: vi.fn(),
}));
vi.mock("../../../hooks/requests/useCreateRequest", () => ({
  useCreateTravelRequest: vi.fn(),
}));
vi.mock("../../../hooks/requests/useUpdateRequest", () => ({
  useUpdateTravelRequest: vi.fn(),
}));

/* ---------------------------------------------------------------- */
/*  Shared test data                                                */
/* ---------------------------------------------------------------- */

const mockNavigate = vi.fn();
const mockDestinationOptions = [
  { id: "1", name: "Destination 1" },
  { id: "2", name: "Destination 2" },
];

const mockDestinations = [
  {
    id: "1",
    city: "City One",
    country: "C1",
    airports: [{ id: "a1", name: "AP1", iata_code: "X1" }],
  },
  {
    id: "2",
    city: "City Two",
    country: "C2",
    airports: [{ id: "a2", name: "AP2", iata_code: "X2" }],
  },
];

beforeEach(() => {
  vi.clearAllMocks();

  (useNavigate as any).mockReturnValue(mockNavigate);
  (useDestinations as any).mockReturnValue({
    destinations: mockDestinations,
    destinationOptions: mockDestinationOptions,
    isLoading: false,
  });
  (useCreateTravelRequest as any).mockReturnValue({
    createTravelRequestMutation: vi.fn(),
    isPending: false,
  });
  (useUpdateTravelRequest as any).mockReturnValue({
    updateTravelRequestMutation: vi.fn(),
    isPending: false,
  });
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

/* ---------------------------------------------------------------- */
/*  Tests                                                           */
/* ---------------------------------------------------------------- */

describe("TravelRequestForm", () => {
  it("renders the form with initial values", () => {
    renderWithProviders(<TravelRequestForm />);

    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/motivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prioridad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dinero adelantado/i)).toBeInTheDocument();
  });

  it("shows validation errors for required fields", async () => {
    renderWithProviders(<TravelRequestForm />);
    await userEvent.click(screen.getByRole("button", { name: /crear viaje/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/escribe el título del viaje/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/escribe el motivo del viaje/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/selecciona fecha de salida/i)
      ).toBeInTheDocument();
    });
  });

  it("allows adding and removing destinations", async () => {
    renderWithProviders(<TravelRequestForm />);

    await userEvent.click(
      screen.getByRole("button", { name: /\+ añadir destino/i })
    );
    expect(screen.getByText(/Tramo #2:/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Quitar$/i }));
    expect(screen.queryByText(/Tramo #2:/i)).not.toBeInTheDocument();
  });

  it("calculates stay days based on arrival and departure dates", async () => {
    renderWithProviders(<TravelRequestForm />);
    const user = userEvent.setup();
    const roundTripSwitch = screen.getAllByRole("switch")[0];
    await user.click(roundTripSwitch);

    await user.type(
      screen.getByLabelText(/Salida de Origen/i),
      "2024-03-01",
    );
    await user.type(
      screen.getByLabelText(/Fecha de regreso/i),
      "2024-03-05",
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/no\. días estancia/i)).toHaveValue(4);
    });
  });

  it("submits the form with valid data", async () => {
    const mockCreateMutation = vi.fn();
    (useCreateTravelRequest as any).mockReturnValue({
      createTravelRequestMutation: mockCreateMutation,
      isPending: false,
    });

    renderWithProviders(<TravelRequestForm />);
    const user = userEvent.setup();

    const roundTripSwitch = screen.getAllByRole("switch")[0];
    await user.click(roundTripSwitch);

    /* --- basic fields --- */
    await user.type(screen.getByLabelText(/título/i), "Test Trip");
    await user.type(screen.getByLabelText(/motivo/i), "Business Meeting");
    await user.type(screen.getByLabelText(/dinero adelantado/i), "1000");

    /* --- origin city dropdown --- */
    await user.click(screen.getByLabelText(/ciudad origen/i));
    await user.click(
      await screen.findByRole("option", { name: "Destination 1" })
    );

    /* --- priority dropdown --- */
    await user.click(screen.getByLabelText(/prioridad/i));
    await user.click(await screen.findByRole("option", { name: "Alta" }));

    /* --- destination (distinta al origen) + aeropuerto --- */
    await user.click(screen.getAllByLabelText(/^Destino$/i)[0]);
    await user.click(
      await screen.findByRole("option", { name: "Destination 2" })
    );
    await user.click(screen.getAllByLabelText(/^Aeropuerto$/i)[0]);
    await user.click(
      await screen.findByRole("option", { name: /X2 - AP2/i })
    );

    /* --- fechas y detalles del tramo --- */
    await user.type(screen.getByLabelText(/detalles/i), "Hotel details");
    await user.type(screen.getByLabelText(/Salida de City One/i), "2024-03-01");
    await user.type(
      screen.getByLabelText(/Fecha de regreso/i),
      "2024-03-05",
    );

    /* --- submit + confirmación --- */
    await user.click(screen.getByRole("button", { name: /crear viaje/i }));
    await user.click(
      await screen.findByRole("button", { name: /Sí, enviar solicitud/i })
    );

    await waitFor(() => {
      expect(mockCreateMutation).toHaveBeenCalledWith({
        id_origin_city: "1",
        title: "Business Meeting",
        motive: "Business Meeting",
        priority: "alta",
        advance_money: 1000,
        requirements: "",
        is_round_trip: true,
        requests_destinations: [
          {
            id_destination: "2",
            id_airport: "a2",
            destination_order: 1,
            stay_days: 4,
            arrival_date: expect.any(String),
            departure_date: expect.any(String),
            is_hotel_required: true,
            is_plane_required: true,
            is_last_destination: true,
            details: "Hotel details",
          },
        ],
      });
    });
  });

  it("handles form submission errors", async () => {
    const mockCreateMutation = vi
      .fn()
      .mockRejectedValue(new Error("API Error"));
    (useCreateTravelRequest as any).mockReturnValue({
      createTravelRequestMutation: mockCreateMutation,
      isPending: false,
    });

    renderWithProviders(<TravelRequestForm />);
    const user = userEvent.setup();

    const roundTripSwitch = screen.getAllByRole("switch")[0];
    await user.click(roundTripSwitch);

    // Same happy-path typing sequence as above
    await user.type(screen.getByLabelText(/título/i), "Test Trip");
    await user.type(screen.getByLabelText(/motivo/i), "Business Meeting");
    await user.type(screen.getByLabelText(/dinero adelantado/i), "1000");

    await user.click(screen.getByLabelText(/ciudad origen/i));
    await user.click(
      await screen.findByRole("option", { name: "Destination 1" })
    );

    await user.click(screen.getByLabelText(/prioridad/i));
    await user.click(await screen.findByRole("option", { name: "Alta" }));

    await user.click(screen.getAllByLabelText(/^Destino$/i)[0]);
    await user.click(
      await screen.findByRole("option", { name: "Destination 2" })
    );
    await user.click(screen.getAllByLabelText(/^Aeropuerto$/i)[0]);
    await user.click(
      await screen.findByRole("option", { name: /X2 - AP2/i })
    );

    await user.type(screen.getByLabelText(/detalles/i), "Hotel details");
    await user.type(screen.getByLabelText(/Salida de City One/i), "2024-03-01");
    await user.type(
      screen.getByLabelText(/Fecha de regreso/i),
      "2024-03-05",
    );

    await user.click(screen.getByRole("button", { name: /crear viaje/i }));
    await user.click(
      await screen.findByRole("button", { name: /Sí, enviar solicitud/i })
    );

    await waitFor(() => expect(mockCreateMutation).toHaveBeenCalled());
  });
});
