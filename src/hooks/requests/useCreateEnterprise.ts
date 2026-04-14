/* Defines a custom React hook called useCreateEnterprise that handles the creation of a new enterprise using React Query’s useMutation. The createEnterprise function sends a POST request to the /enterprises endpoint with the provided payload. The hook wraps this logic in a mutation that, upon successful creation, automatically invalidates the "enterprises" query cache to trigger a refetch and keep the UI data up to date. It also handles errors by logging them and re-throwing the AxiosError. The hook returns the asynchronous mutation function (createEnterpriseMutation) along with an isPending state to indicate when the request is in progress. */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { postRequest } from "../../utils/apiService";
import { CreateEnterprise } from "../../types/requests";

export async function createEnterprise(payload: CreateEnterprise) {
  return postRequest("/enterprises", payload);
}

export function useCreateEnterprise() {
  const queryClient = useQueryClient();

  const { mutateAsync: createEnterpriseMutation, isPending } = useMutation({
    mutationFn: (payload: CreateEnterprise) => createEnterprise(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enterprises"] });
    },
    onError: (error: AxiosError) => {
      console.error("Error creating enterprise:", error);
      throw error;
    },
  });

  return { createEnterpriseMutation, isPending };
}