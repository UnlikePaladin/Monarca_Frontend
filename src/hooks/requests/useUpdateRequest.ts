/*Defines a function and a custom React hook for updating an existing travel request using React Query’s mutation system. The updateRequest function sends a PUT request to the /requests/{requestId} endpoint with the updated CreateRequest payload. The useUpdateTravelRequest hook wraps this logic inside a useMutation, exposing an asynchronous mutation function (updateTravelRequestMutation) and a loading state (isPending). When the update succeeds, it invalidates the "travelRequests" query cache to ensure the list of travel requests is refreshed with the latest data. If an error occurs, it logs the AxiosError and re-throws it for further handling. */

import { CreateRequest } from "../../types/requests";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putRequest } from "../../utils/apiService";
import { AxiosError } from "axios";

export async function updateRequest(requestId: string, payload: CreateRequest) {
  return putRequest(`/requests/${requestId}`, payload);
}

export function useUpdateTravelRequest() {
  const queryClient = useQueryClient();

  const { mutateAsync: updateTravelRequestMutation, isPending } = useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string;
      payload: CreateRequest;
    }) => updateRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travelRequests"] });
    },
    onError: (error: AxiosError) => {
      console.error("Error updating travel request:", error);
      throw error;
    },
  });

  return { updateTravelRequestMutation, isPending };
}
