///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import {
  BulkStatus,
  RefsetMember,
  RefsetMembersResponse,
} from '../types/RefsetMember.ts';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';
import { api } from './api.ts';

const RefsetMembersService = {
  handleErrors: () => {
    throw new Error('invalid refset members response');
  },
  async getRefsetMembers(
    branch: string,
    referenceSet: string,
    options?: {
      referencedComponentId?: string[];
      active?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<RefsetMembersResponse> {
    const { limit, offset, referencedComponentId, active } = options ?? {};

    const url = `/snowstorm/${branch}/members`;
    const params = new URLSearchParams({
      referenceSet,
    });
    if (limit) params.set('limit', `${limit}`);
    if (offset !== undefined) params.set('offset', `${offset}`);
    if (active !== undefined) params.set('active', `${active}`);
    referencedComponentId?.forEach(conceptId => {
      params.append('referencedComponentId', conceptId);
    });

    const response = await api.get(url, {
      params,
      headers: {
        Accept: 'application/json',
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const membersResponse = response.data as RefsetMembersResponse;

    return membersResponse;
  },
  async searchRefsetMembers(
    branch: string,
    referenceSet: string,
    referencedComponentIds: string[],
    options?: {
      limit?: number;
      offset?: number;
      active?: boolean;
    },
  ): Promise<RefsetMembersResponse> {
    const { limit, offset, active } = options ?? {};

    const url = `/snowstorm/${branch}/members/search`;
    const params = new URLSearchParams();
    if (limit) params.set('limit', `${limit}`);
    if (offset !== undefined) params.set('offset', `${offset}`);

    const filters: Record<string, string | string[] | boolean> = {
      referenceSet,
      referencedComponentIds,
    };
    if (active !== undefined) filters.active = active;

    const response = await api.post(url, filters, {
      params,
      headers: {
        Accept: 'application/json',
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const membersResponse = response.data as RefsetMembersResponse;

    return membersResponse;
  },
  async getRefsetMembersByComponentIds(
    branch: string,
    referencedComponentIds: string[],
  ): Promise<RefsetMembersResponse> {
    const offset = 0;
    const limit = 150; //TODO better way to handle(150 is enough for now)
    const idList = referencedComponentIds.join(',');
    const params: Record<string, string | number | boolean> = {
      referencedComponentId: idList,
      active: true,
      offset: offset,
      limit: limit,
    };

    const url = `/snowstorm/${branch}/members`;
    const response = await api.get(url, {
      params: params,
      headers: {
        Accept: 'application/json',
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const membersResponse = response.data as RefsetMembersResponse;

    return membersResponse;
  },
  async getRefsetMemberById(
    branch: string,
    memberId: string,
  ): Promise<RefsetMember> {
    const url = `/snowstorm/${branch}/members/${memberId}`;
    const response = await api.get(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`,
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const member = response.data as RefsetMember;

    return member;
  },
  async updateRefsetMember(
    branch: string,
    member: RefsetMember,
  ): Promise<RefsetMember> {
    const { memberId } = member;
    if (!memberId) this.handleErrors();

    const url = `/snowstorm/${branch}/members/${memberId}`;
    const response = await api.put(url, member, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const updatedMember = response.data as RefsetMember;

    return updatedMember;
  },
  async createRefsetMember(
    branch: string,
    member: RefsetMember,
  ): Promise<RefsetMember> {
    const { referencedComponentId } = member;
    if (!referencedComponentId) this.handleErrors();

    const url = `/snowstorm/${branch}/members`;
    const response = await api.post(url, member, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const newMember = response.data as RefsetMember;

    return newMember;
  },
  async bulkUpdate(
    branch: string,
    members: RefsetMember[],
  ): Promise<string | undefined> {
    const url = `/snowstorm/${branch}/members/bulk`;
    const response = await api.post(url, members, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (response.status != 201 || !response.headers.location) {
      this.handleErrors();
    }
    return (response.headers.location as string)?.split('/').pop();
  },
  async bulkStatus(branch: string, bulkChangeId: string): Promise<BulkStatus> {
    const url = `/snowstorm/${branch}/members/bulk/${bulkChangeId}`;
    const response = await api.get(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }
    const bulkStatus = response.data as BulkStatus;
    if (bulkStatus.status === 'FAILED') {
      throw new Error(bulkStatus.message);
    }
    return bulkStatus;
  },
  async searchRefsetMembersBatched(
    branch: string,
    referenceSet: string,
    referencedComponentIds: string[],
    options?: {
      active?: boolean;
    },
  ) {
    const defaultBatchSize = 50;
    const batchSize =
      referencedComponentIds.length > defaultBatchSize
        ? defaultBatchSize
        : referencedComponentIds.length;

    const batches = [];
    for (let i = 0; i < referencedComponentIds.length; i += batchSize) {
      const batch = referencedComponentIds.slice(i, i + batchSize);
      batches.push(batch);
    }
    try {
      const fetchPromises = batches.map(
        async refCompIds =>
          await this.searchRefsetMembers(branch, referenceSet, refCompIds, {
            limit: 200,
            ...options,
          }),
      );
      const results = await Promise.all(fetchPromises);
      const refsetMembers = results.flatMap(c => c.items);
      return refsetMembers;
    } catch (error) {
      console.error('One or more API calls failed:', error);
    }
    return [];
  },
};

export default RefsetMembersService;
