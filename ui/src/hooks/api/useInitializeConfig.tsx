import { ConfigService } from '../../api/ConfigService';
import { useQuery } from '@tanstack/react-query';
import { FieldBindings } from '../../types/FieldBindings.ts';
import { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';

export function useApplicationConfig() {
  const { isLoading, data } = useQuery({
    queryKey: ['config'],
    queryFn: () => {
      return ConfigService.getApplicationConfig();
    },
    staleTime: 1 * (60 * 1000),
  });

  const applicationConfigIsLoading: boolean = isLoading;
  const applicationConfig = data;

  return { applicationConfigIsLoading, applicationConfig };
}

export function useSecureApplicationConfig() {
  const { isLoading, data } = useQuery({
    queryKey: ['secure-config'],
    queryFn: () => {
      return ConfigService.getSecureApplicationConfig();
    },
    staleTime: Infinity,
  });

  const secureAppConfigIsLoading: boolean = isLoading;
  const secureAppConfig = data;

  return { secureAppConfigIsLoading, secureAppConfig };
}

export function useFieldBindings(branch: string | undefined) {
  const { isLoading, data } = useQuery({
    queryKey: [`fieldBindings-${branch}`],
    queryFn: () => ConfigService.loadFieldBindings(branch as string),
    staleTime: Infinity,
    enabled: branch !== undefined,
  });

  const fieldBindingIsLoading: boolean = isLoading;
  const fieldBindings = data as FieldBindings;

  return { fieldBindingIsLoading, fieldBindings };
}

const RELEASE_VERSION_CHECK_INTERVAL = 60000;

export function useFetchReleaseVersion() {
  const { enqueueSnackbar } = useSnackbar();
  const initialReleaseVersion = useRef<string | null>(null);
  const hasShownRefreshSnackbar = useRef(false);

  const { isLoading, data } = useQuery({
    queryKey: [`releaseVersion`],
    queryFn: () => ConfigService.getReleaseVersion(),
    refetchInterval: RELEASE_VERSION_CHECK_INTERVAL,
  });

  // Store the initial release version on first load
  useEffect(() => {
    if (data && initialReleaseVersion.current === null) {
      initialReleaseVersion.current = data;
    }
  }, [data]);

  // Check if version has changed and show snackbar
  useEffect(() => {
    if (
      data &&
      initialReleaseVersion.current &&
      data !== initialReleaseVersion.current &&
      !hasShownRefreshSnackbar.current
    ) {
      enqueueSnackbar(
        'A new version is available. Please refresh the page to update.',
        {
          variant: 'error',
          persist: true,
        },
      );

      hasShownRefreshSnackbar.current = true;
    }
  }, [data, enqueueSnackbar]);

  return { isLoadingReleaseVersion: isLoading, releaseVersion: data };
}
