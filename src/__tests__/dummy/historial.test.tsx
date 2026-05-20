import { describe, it, expect } from "vitest";
import { HISTORIAL_DATA } from "../../pages/Historial/local/dummyData";

describe("HISTORIAL_DATA", () => {
  it("exports array with 3 items", () => {
    expect(Array.isArray(HISTORIAL_DATA)).toBe(true);
    expect(HISTORIAL_DATA).toHaveLength(3);
  });

  it("contains required properties", () => {
    const requiredProps = ["id", "title", "travelDate", "destination", "requestDate"];
    
    HISTORIAL_DATA.forEach(item => {
      requiredProps.forEach(prop => {
        expect(item).toHaveProperty(prop);
        expect(typeof (item as any)[prop]).toBe("string");
      });
    });
  });

  it("contains expected data", () => {
    expect(HISTORIAL_DATA[0]).toEqual({
      id: "0001",
      title: "Viaje a Cancun",
      travelDate: "14/09/2020",
      destination: "Cancun, MX",
      requestDate: "10/09/2020",
    });
  });
});
