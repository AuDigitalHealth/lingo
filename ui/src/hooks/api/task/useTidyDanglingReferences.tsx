///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///

import { useMutation, useQueryClient } from '@tanstack/react-query';
import TasksServices from '../../../api/TasksService';
import { TidyResult } from '../../../types/danglingReferences';

interface Params {
  projectKey: string;
  taskKey: string;
}

export function useTidyDanglingReferences() {
  const queryClient = useQueryClient();
  return useMutation<TidyResult, Error, Params>({
    mutationFn: ({ projectKey, taskKey }) =>
      TasksServices.tidyDanglingReferences(projectKey, taskKey),
    onError: (error: Error) => {
      console.error('Tidy dangling references mutation failed:', error);
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [
          'dangling-references',
          variables.projectKey,
          variables.taskKey,
        ],
      });
    },
  });
}
