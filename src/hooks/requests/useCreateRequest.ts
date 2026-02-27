/* Defines a custom React hook called useCreateTravelRequest that handles the creation of a new travel request using React Query’s useMutation. The createRequest function sends a POST request to the /requests endpoint with the provided payload. The hook wraps this logic in a mutation that, upon successful creation, automatically invalidates the "travelRequests" query cache to trigger a refetch and keep the UI data up to date. It also handles errors by logging them and re-throwing the AxiosError. The hook returns the asynchronous mutation function (createTravelRequestMutation) along with an isPending state to indicate when the request is in progress. */

import { CreateRequest } from "../../types/requests";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "../../utils/apiService";
import { AxiosError } from "axios";

export async function createRequest(payload: CreateRequest) {
  return postRequest("/requests", payload);
}

export function useCreateTravelRequest() {
  const queryClient = useQueryClient();

  const { mutateAsync: createTravelRequestMutation, isPending } = useMutation({
    mutationFn: (payload: CreateRequest) => createRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travelRequests"] });
    },
    onError: (error: AxiosError) => {
      console.error("Error creating travel request:", error);
      throw error;
    },
  });

  return { createTravelRequestMutation, isPending };
}
