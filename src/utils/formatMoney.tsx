/*Defines and exports a utility function called formatMoney that formats a numeric value as Mexican currency. It first validates that the input is a valid number; if not, it safely returns "$0.00" as a fallback. If the value is valid, it uses JavaScript’s toLocaleString method with the "es-MX" locale and currency formatting options to return the number formatted in Mexican pesos (MXN), including the appropriate currency symbol, thousands separators, and decimal places. */

const formatMoney = (value: number): string => {
  if (typeof value !== "number" || isNaN(value)) {
    return "$0.00";
  }
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
};

export default formatMoney;
