import { useMemo } from "react";
import { ConfigService } from "../../api/ConfigService";
import useApplicationConfigStore from "../../stores/ApplicationConfigStore";
import { useQuery } from '@tanstack/react-query';

export function useInitializeConfig() {
    const { updateApplicationConfigState } = useApplicationConfigStore();
    const { isLoading, data } = useQuery(
      ['config'],
      () => {
        return ConfigService.getApplicationConfig();
      },
      { staleTime: 1 * (60 * 1000) },
    );
  
    useMemo(() => {
      if (data) {
        updateApplicationConfigState(data);
      }
    }, [data, updateApplicationConfigState]);
  
    const applicationConfigIsLoading: boolean = isLoading;
    const applicationConfig = data;
  
    return { applicationConfigIsLoading, applicationConfig };
  }