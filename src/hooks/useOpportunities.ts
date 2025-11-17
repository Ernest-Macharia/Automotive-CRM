// src/hooks/useOpportunities.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { opportunityService } from '@/services/opportunityService';
import {
  Opportunity,
  CreateOpportunityData,
  OpportunityOverview,
} from '@/types/opportunity';

type ApiError = {
  message: string;
  status?: number;
};

type QueryError = Error | ApiError;

// GET ALL
export function useOpportunities(): UseQueryResult<Opportunity[], QueryError> {
  return useQuery<Opportunity[], QueryError>({
    queryKey: ['opportunities'],
    queryFn: opportunityService.getOpportunities,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

// GET ONE
export function useOpportunity(
  id: string | undefined
): UseQueryResult<Opportunity | null, QueryError> {
  return useQuery<Opportunity | null, QueryError>({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      if (!id) throw new Error('Opportunity ID is required');
      return await opportunityService.getOpportunity(id);
    },
    enabled: !!id,
    placeholderData: null,
  });
}

// GET OVERVIEW
export function useOpportunityOverview(): UseQueryResult<OpportunityOverview, QueryError> {
  return useQuery<OpportunityOverview, QueryError>({
    queryKey: ['opportunities', 'overview'],
    queryFn: opportunityService.getOverview,
    staleTime: 2 * 60 * 1000, // 2 mins
  });
}

// CREATE
export function useCreateOpportunity(): UseMutationResult<
  Opportunity,
  QueryError,
  CreateOpportunityData
> {
  const queryClient = useQueryClient();

  return useMutation<Opportunity, QueryError, CreateOpportunityData>({
    mutationFn: opportunityService.createOpportunity,
    onSuccess: (newOpportunity) => {
      // Optimistic: prepend new opportunity
      queryClient.setQueryData<Opportunity[]>(['opportunities'], (old = []) => [
        newOpportunity,
        ...old,
      ]);
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'overview'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

// UPDATE
export function useUpdateOpportunity(): UseMutationResult<
  Opportunity,
  QueryError,
  { id: string; data: Partial<CreateOpportunityData> }
> {
  const queryClient = useQueryClient();

  return useMutation<
    Opportunity,
    QueryError,
    { id: string; data: Partial<CreateOpportunityData> }
  >({
    mutationFn: ({ id, data }) => opportunityService.updateOpportunity(id, data),
    onSuccess: (updatedOpportunity, { id }) => {
      // Update single
      queryClient.setQueryData<Opportunity | null>(['opportunity', id], updatedOpportunity);
      
      // Update list
      queryClient.setQueryData<Opportunity[]>(['opportunities'], (old = []) =>
        old.map((opp) => (opp.id === id ? updatedOpportunity : opp))
      );

      // Refresh overview
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'overview'] });
    },
  });
}

// UPDATE STATUS (SEPARATE — RECOMMENDED)
export function useUpdateOpportunityStatus(): UseMutationResult<
  Opportunity,
  QueryError,
  { id: string; status: Opportunity['status'] }
> {
  const queryClient = useQueryClient();

  return useMutation<
    Opportunity,
    QueryError,
    { id: string; status: Opportunity['status'] }
  >({
    mutationFn: ({ id, status }) => opportunityService.updateStatus(id, status),
    onSuccess: (updatedOpportunity, { id }) => {
      queryClient.setQueryData<Opportunity | null>(['opportunity', id], updatedOpportunity);
      queryClient.setQueryData<Opportunity[]>(['opportunities'], (old = []) =>
        old.map((opp) => (opp.id === id ? updatedOpportunity : opp))
      );
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'overview'] });
    },
  });
}

// DELETE
export function useDeleteOpportunity(): UseMutationResult<void, QueryError, string> {
  const queryClient = useQueryClient();

  return useMutation<void, QueryError, string>({
    mutationFn: opportunityService.deleteOpportunity,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Opportunity[]>(['opportunities'], (old = []) =>
        old.filter((opp) => opp.id !== deletedId)
      );
      queryClient.removeQueries({ queryKey: ['opportunity', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'overview'] });
    },
  });
}