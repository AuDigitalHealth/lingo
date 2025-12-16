import { useMemo } from 'react';
import { LanguageRefset, Project } from '../../../types/Project';

interface UseProjectLangRefsetsProps {
  project: Project | undefined;
}

// eslint-disable-next-line
const USLangRefset: LanguageRefset = {
  default: 'false',
  en: '900000000000509007',
  dialectName: 'US',
  readOnly: 'false',
};

export default function useProjectLangRefsets({
  project,
}: UseProjectLangRefsetsProps) {
  const langRefsets = useMemo(() => {
    if (project === undefined || project.metadata === undefined) {
      return [];
    }
    const fromApi = [...project.metadata.requiredLanguageRefsets];
    if (
      fromApi.filter(item => {
        return item.en === USLangRefset.en;
      }).length === 0
    ) {
      fromApi.push(USLangRefset);
    }

    return fromApi;
  }, [project]);

  return langRefsets;
}
