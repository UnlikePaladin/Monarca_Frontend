/*
useExchangeRate.ts
React Query hook for exchange rate lookups.
*/
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "../../utils/apiService";

export type ExchangeRateResponse = {
  date: string;
  rate: number;
  sourceCurrency: string;
  targetCurrency: string;
  isFallback: boolean;
};

/**
 * Fetches the exchange rate for a given date and source currency.
 * @param date Date in YYYY-MM-DD format.
 * @param currency Source currency code.
 */

async function fetchExchangeRate(
  date: string,
  currency: string
): Promise<ExchangeRateResponse> {
  return getRequest("/exchange-rates", { date, currency });
}

/**
 * Provides a cached exchange rate query.
 * @param date Date in YYYY-MM-DD format.
 * @param currency Source currency code.
 * @param enabled Whether the query should run.
 */

export function useExchangeRate(
  date: string,
  currency: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["exchangeRate", date, currency],
    queryFn: () => fetchExchangeRate(date, currency),
    enabled,
  });
}

/*
Modification History:
- 2026-04-29| Fabrizio Barrios Blanco | Added exchange rate hook.
*/