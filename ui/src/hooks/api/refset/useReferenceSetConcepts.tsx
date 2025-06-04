import { useQuery } from '@tanstack/react-query';
import ConceptService from '../../../api/ConceptService.ts';
import { Concept } from '../../../types/concept.ts';

// A hook that fetches and caches reference set concepts
export function useReferenceSetConcepts(refsetIds: string[], branch: string) {
  return useQuery({
    // Use a consistent query key for caching
    queryKey: ['reference-set-concepts', refsetIds.sort().join(','), branch],

    // Fetch the concepts if not in cache
    queryFn: async () => {
      const concepts = await ConceptService.searchConceptsByIds(refsetIds, branch);

      // Create a map of refsetId -> concept for easy lookup
      const conceptMap: Record<string, Concept> = {};
      concepts.forEach(concept => {
        if (concept.conceptId) {
          conceptMap[concept.conceptId] = concept;
        }
      });

      return conceptMap;
    },

    // Cache the results for a long time (24 hours) since reference sets are stable
    staleTime: 24 * 60 * 60 * 1000, // 24 hours

    // Only run the query if we have refsetIds
    enabled: refsetIds.length > 0,
  });
}