import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PolicyAlert } from "../../components/Refunds/PolicyAlert";

describe("PolicyAlert Component", () => {
  it("no renderiza nada si no hay violaciones", () => {
    const { container } = render(<PolicyAlert violations={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el mensaje y estilo correcto para una violación BLOCKING (Rojo)", () => {
    const mockViolations = [
      { 
        policy_code: "REQ_001", 
        message: "Falta XML", 
        severity: "BLOCKING" as const 
      }
    ];
    render(<PolicyAlert violations={mockViolations} />);

    const messageElement = screen.getByText("Falta XML");
    expect(messageElement).toBeInTheDocument();
    
    const alertBox = messageElement.closest('div.p-4');
    expect(alertBox).toHaveClass("bg-red-50");
    expect(alertBox).toHaveClass("border-red-500");
    expect(screen.getByText("❌")).toBeInTheDocument();
  });

  it("muestra el mensaje y estilo correcto para una violación WARNING (Amarillo)", () => {
    const mockViolations = [
      { 
        policy_code: "WARN_001", 
        message: "Monto bajo", 
        severity: "WARNING" as const 
      }
    ];
    render(<PolicyAlert violations={mockViolations} />);
    
    const messageElement = screen.getByText("Monto bajo");
    const alertBox = messageElement.closest('div.p-4');
    expect(alertBox).toHaveClass("bg-yellow-50"); 
    expect(alertBox).toHaveClass("border-yellow-400");
    expect(screen.getByText("⚠️")).toBeInTheDocument();
  });

  it("muestra detalles específicos para la regla TOTAL_LTE_ADVANCE", () => {
    const mockViolations = [
      { 
        policy_code: "TOTAL_LTE_ADVANCE", 
        message: "Exceso de anticipo", 
        severity: "BLOCKING" as const,
        evaluated_value: { total_vouchers: 6000, advance_money: 5000 }
      }
    ];
    render(<PolicyAlert violations={mockViolations} />);
    
    expect(screen.getByText(/Total detectado:/)).toBeInTheDocument();
    expect(screen.getByText(/\$6000/)).toBeInTheDocument();
    expect(screen.getByText(/\$5000/)).toBeInTheDocument();
  });

  it("muestra detalles específicos para la regla VOUCHER_DATE_WITHIN_TRIP_WINDOW", () => {
    const mockViolations = [
      { 
        policy_code: "VOUCHER_DATE_WITHIN_TRIP_WINDOW", 
        message: "Fecha fuera de rango", 
        severity: "BLOCKING" as const,
        evaluated_value: { 
          trip_start_date: "2026-04-01T00:00:00Z", 
          trip_end_date: "2026-04-05T00:00:00Z" 
        }
      }
    ];
    render(<PolicyAlert violations={mockViolations} />);
    
    expect(screen.getByText(/Rango del viaje permitido:/)).toBeInTheDocument();
    expect(screen.getAllByText(/2026/)).toHaveLength(2);
  });

  it("muestra detalles específicos para la regla DAYS_EXCEEDED", () => {
    const mockViolations = [
      { 
        policy_code: "DAYS_EXCEEDED", 
        message: "Plazo vencido", 
        severity: "BLOCKING" as const,
        evaluated_value: { elapsed_days: 30, max_days: 28 }
      }
    ];
    render(<PolicyAlert violations={mockViolations} />);
    
    expect(screen.getByText(/Días desde la creación:/)).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText(/28 días/)).toBeInTheDocument();
  });

  it("muestra la etiqueta de severidad en mayúsculas", () => {
    const mockViolations = [
      { 
        policy_code: "TEST_01", 
        message: "Error de prueba", 
        severity: "BLOCKING" as const 
      }
    ];
    render(<PolicyAlert violations={mockViolations} />);
    
    const severityBadge = screen.getByText("BLOCKING");
    expect(severityBadge).toBeInTheDocument();
    expect(severityBadge).toHaveClass("uppercase");
  });
});