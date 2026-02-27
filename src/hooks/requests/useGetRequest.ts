/* Defines a function and a custom React hook for retrieving a single travel request by its ID using React Query. The fetchTravelRequest function sends a GET request to the /requests/{id} endpoint and returns the corresponding CreateRequest data. The useGetRequest hook wraps this logic with useQuery, caching the result under a unique query key that includes the request ID. The query is conditionally enabled only when a valid id is provided (enabled: !!id), preventing unnecessary API calls. This setup efficiently manages fetching, caching, and updating the travel request data within the application. */

import { useQuery } from "@tanstack/react-query";
import { getRequest } from "../../utils/apiService";
import { CreateRequest } from "../../types/requests";

export async function fetchTravelRequest(id: string): Promise<CreateRequest> {
  return getRequest(`/requests/${id}`);
}

export function useGetRequest(id: string) {
  return useQuery({
    queryKey: ["travelRequest", id],
    queryFn: () => fetchTravelRequest(id),
    enabled: !!id,
  });
}
