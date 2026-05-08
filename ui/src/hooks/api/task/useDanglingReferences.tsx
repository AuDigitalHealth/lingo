///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///

import { useQuery } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';
import { DanglingReferenceSummary } from '../../../types/danglingReferences';

interface Params {
  projectKey: string | undefined;
  taskKey: string | undefined;
  enabled?: boolean;
}

export function useDanglingReferences({
  projectKey,
  taskKey,
  enabled = true,
}: Params) {
  return useQuery<DanglingReferenceSummary>({
    queryKey: ['dangling-references', projectKey, taskKey],
    queryFn: async () => {
      try {
        return await TasksServices.getDanglingReferences(
          projectKey as string,
          taskKey as string,
        );
      } catch (error) {
        console.error('Dangling references detection failed:', error);
        throw error;
      }
    },
    enabled: enabled && Boolean(projectKey) && Boolean(taskKey),
    retry: 1,
  });
}
