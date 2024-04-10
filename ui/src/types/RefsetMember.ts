export interface RefsetMember {
  path?: string;
  start?: string;
  end?: string;
  deleted?: boolean;
  changed?:	boolean;
  active?: boolean;
  moduleId?: string;
  released?: boolean;
  releaseHash?: string;
  releasedEffectiveTime?: number;
  memberId?: string;
  refsetId: string;
  referencedComponentId: string;
  conceptId?: string;
  additionalFields?: Record<string, string>,
  referencedComponent?: object;
  effectiveTime?: string;
}

export interface RefsetMembersResponse {
  items: RefsetMember[];
  total: number;
  limit: number;
  offset: number;
  searchAfter: string;
  searchAfterArray: string[];
}