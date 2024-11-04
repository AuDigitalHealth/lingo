import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import ConceptService from '../../api/ConceptService';
import { snowstormErrorHandler } from '../../types/ErrorHandler';
import { useServiceStatus } from '../api/useServiceStatus';

export const useValidateConcepts = (branch: string) => {
  const queryClient = useQueryClient();
  const { serviceStatus } = useServiceStatus();
  const [validateLoading, setValidateLoading] = useState(false);
  const [progress, setProgress] = useState({
    retrieved: 0,
    total: 0,
  });

  const validateConceptIds = async (
    conceptIds: string[],
    allowInactives = false,
  ) => {
    setValidateLoading(true);
    return queryClient
      .fetchQuery({
        queryKey: [
          `concept-${branch}-validate-ids-${allowInactives}`,
          conceptIds,
        ],
        queryFn: async () => {
          if (conceptIds.length) {
            const defaultBatchSize = 10000;
            const batchSize =
              conceptIds.length > defaultBatchSize
                ? defaultBatchSize
                : conceptIds.length;

            setProgress({
              retrieved: 0,
              total: conceptIds.length,
            });

            const batches = [];
            for (let i = 0; i < conceptIds.length; i += batchSize) {
              const batch = conceptIds.slice(i, i + batchSize);
              batches.push(batch);
            }

            return Promise.all(
              batches.map(conceptIds =>
                ConceptService.searchConceptIdsBulkFilters(branch, {
                  conceptIds,
                  activeFilter: !allowInactives ? true : undefined,
                  limit: conceptIds.length,
                }).then(rsp => {
                  setProgress(prog => ({
                    ...prog,
                    retrieved: prog.retrieved + rsp.items.length,
                  }));
                  return rsp;
                }),
              ),
            ).then(results => results.flatMap(rsp => rsp.items));
          }
          return [];
        },
      })
      .catch(error => {
        snowstormErrorHandler(error, 'Search Failed', serviceStatus);
        return undefined;
      })
      .finally(() => setValidateLoading(false));
  };

  return { validateLoading, validateConceptIds, progress };
};
