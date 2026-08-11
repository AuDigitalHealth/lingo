import { useMutation, useQueryClient } from '@tanstack/react-query';
import TicketsService from '../../../api/TicketsService';
import { ExportPreset, ExportPresetDto } from '../../../types/tickets/ticket';
import { LingoProblem } from '../../../types/ErrorHandler';

export function useCreateExportPreset() {
  const queryClient = useQueryClient();
  return useMutation<ExportPreset, LingoProblem, ExportPresetDto>({
    mutationFn: async (preset: ExportPresetDto) => {
      return TicketsService.createExportPreset(preset);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['export-presets'] });
    },
  });
}

export function useUpdateExportPreset() {
  const queryClient = useQueryClient();
  return useMutation<
    ExportPreset,
    LingoProblem,
    { id: number; preset: ExportPresetDto }
  >({
    mutationFn: async (data: { id: number; preset: ExportPresetDto }) => {
      return TicketsService.updateExportPreset(data.id, data.preset);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['export-presets'] });
    },
  });
}

export function useDeleteExportPreset() {
  const queryClient = useQueryClient();
  return useMutation<number, LingoProblem, number>({
    mutationFn: async (id: number) => {
      return TicketsService.deleteExportPreset(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['export-presets'] });
    },
  });
}
