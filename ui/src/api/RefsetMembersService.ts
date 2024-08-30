import { RefsetMember, RefsetMembersResponse } from '../types/RefsetMember.ts';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';
import { api } from './api.ts';
const RefsetMembersService = {
  handleErrors: () => {
    throw new Error('invalid refset members response');
  },
  async getRefsetMembers(branch: string): Promise<RefsetMembersResponse> {
    const referenceSet = '900000000000513000';
    const offset = 0;
    const limit = 200;

    const url = `/snowstorm/${branch}/members?referenceSet=${referenceSet}&offset=${offset}&limit=${limit}`;
    const response = await api.get(url, {
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
    const limit = 50;
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
};

export default RefsetMembersService;
