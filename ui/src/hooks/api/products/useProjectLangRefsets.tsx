import { useMemo } from 'react';
import { LanguageRefset, Project } from '../../../types/Project';

interface UseProjectLangRefsetsProps {
  project: Project | undefined;
}

// Fallback US reference set, only injected when a project's metadata omits it.
// A project that does not list US as a required language reference set is not
// authoring US content, so the column is read-only.
// eslint-disable-next-line
const USLangRefset: LanguageRefset = {
  default: 'false',
  en: '900000000000509007',
  dialectName: 'US',
  readOnly: 'true',
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
