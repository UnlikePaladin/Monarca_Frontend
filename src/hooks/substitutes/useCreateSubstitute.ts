/**
 * Description: Hook to create a new substitute delegation via the API.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SubstituteDelegation } from "../../types/auth";
import { postRequest } from "../../utils/apiService";

type CreateSubstitutePayload = Omit<SubstituteDelegation, "id" | "roleId"> & {
  roleId?: string | null;
};

/**
 * Sends a POST request to create a new substitute delegation.
 * @param payload Delegation data excluding the id field.
 * @returns Promise resolving to the created SubstituteDelegation object.
 */
const createSubstitute = async (
  payload: CreateSubstitutePayload,
): Promise<SubstituteDelegation> => {
  const body: Record<string, unknown> = {
    originalUserId: payload.originalUserId,
    targetUserId: payload.targetUserId,
    startDate: payload.startDate,
    endDate: payload.endDate,
  };
  if (payload.roleId != null && payload.roleId !== "") {
    body.roleId = payload.roleId;
  }
  if (payload.notes) body.notes = payload.notes;

  const response = await postRequest("/substitutes", body);
  return response as SubstituteDelegation;
};

/**
 * Hook to create a new substitute delegation. Invalidates the substitutes list cache on success.
 * @returns Mutation object with mutate function and isPending state.
 */
export const useCreateSubstitute = () => {
  const queryClient = useQueryClient();

  return useMutation<SubstituteDelegation, Error, CreateSubstitutePayload>({
    mutationFn: createSubstitute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substitutes"] });
    },
  });
};

/*
 * Modification History:
 * - 2026-03-25 | Juan de Dios Gastélum Flores | Initial file creation.
 * - 2026-04-16 | Juan de Dios Gastélum Flores | Connected to real API endpoint POST /substitutes.
 */