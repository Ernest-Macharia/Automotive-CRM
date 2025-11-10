// src/hooks/useOpportunities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunityService } from '@/services/opportunityService';
import { Opportunity, CreateOpportunityData } from '@/types/opportunity';

export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: () => opportunityService.getOpportunities(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => opportunityService.getOpportunity(id),
    enabled: !!id,
  });
}

export function useOpportunityOverview() {
  return useQuery({
    queryKey: ['opportunities', 'overview'],
    queryFn: () => opportunityService.getOverview(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOpportunityData) => opportunityService.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateOpportunityData> }) =>
      opportunityService.updateOpportunity(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', variables.id] });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => opportunityService.deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}