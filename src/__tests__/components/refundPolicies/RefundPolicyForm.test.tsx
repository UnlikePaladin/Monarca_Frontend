import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RefundPolicyForm } from "../../../components/refundPolicies/RefundPolicyForm";

const updateMutateAsync = vi.fn();
const createMutateAsync = vi.fn();

vi.mock("../../../components/ui/Select", () => ({
  default: ({ options, value, onChange, id }: any) => (
    <select
      id={id}
      data-testid={id || "mock-select"}
      value={value?.id ?? ""}
      onChange={(event) => {
        const selected = options.find(
          (option: { id: string | number }) => String(option.id) === event.target.value
        );

        if (selected) {
          onChange(selected);
        }
      }}
    >
      <option value="">--</option>
      {options.map((option: { id: string | number; name: string }) => (
        <option key={String(option.id)} value={String(option.id)}>
          {option.name}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("../../../components/ui/Button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../../hooks/refundPolicies/useCreateRefundPolicy", () => ({
  useCreateRefundPolicy: () => ({
    mutateAsync: createMutateAsync,
    isPending: false,
  }),
}));

vi.mock("../../../hooks/refundPolicies/useUpdateRefundPolicy", () => ({
  useUpdateRefundPolicy: () => ({
    mutateAsync: updateMutateAsync,
    isPending: false,
  }),
}));

describe("RefundPolicyForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMutateAsync.mockResolvedValue({});
    createMutateAsync.mockResolvedValue({});
  });

  it("includes edited rules in update payload when replaceRules is not selected", async () => {
    render(
      <RefundPolicyForm
        policy={{
          id: "policy-1",
          id_company: "company-1",
          name: "Policy Test",
          description: "Description",
          is_active: true,
          created_at: "2026-04-01",
          rules: [
            {
              expense_class: "HTLP",
              operator: "GT",
              threshold_value: 100,
              threshold_unit: "MXN",
              consequence: "POLICY_VIOLATION",
              is_active: true,
            },
          ],
        }}
        groups={[
          {
            company: { id: "company-1", key: "C1", name: "Company One" },
            policies: [],
          },
        ]}
        onClose={vi.fn()}
      />
    );

    const consequenceWrapper = document.querySelector("#refund_policy_consequence");
    const consequenceSelect = consequenceWrapper?.querySelector("select") as HTMLSelectElement;

    fireEvent.change(consequenceSelect, { target: { value: "WARNING" } });

    const thresholdInput = screen.getByPlaceholderText(
      "Captura un valor numérico"
    ) as HTMLInputElement;
    fireEvent.change(thresholdInput, { target: { value: "999" } });

    fireEvent.click(screen.getByLabelText("Regla activa"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(updateMutateAsync).toHaveBeenCalledWith({
      policyId: "policy-1",
      data: expect.objectContaining({
        rules: [
          expect.objectContaining({
            expense_class: "HTLP",
            operator: "GT",
            threshold_value: 999,
            threshold_unit: "MXN",
            consequence: "WARNING",
            is_active: false,
          }),
        ],
      }),
    });
  });
});
