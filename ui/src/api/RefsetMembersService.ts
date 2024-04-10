import axios from 'axios';
import { RefsetMember, RefsetMembersResponse } from '../types/RefsetMember.ts';
import useApplicationConfigStore from '../stores/ApplicationConfigStore.ts';

const RefsetMembersService = {
  handleErrors: () => {
    throw new Error('invalid refset members response');
  },
  async getRefsetMembers(
    branch: string,
  ): Promise<RefsetMembersResponse> {

    const referenceSet = "900000000000513000";
    const offset = 0;
    const limit = 200;

    const url = `/snowstorm/${branch}/members?referenceSet=${referenceSet}&offset=${offset}&limit=${limit}`;
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`
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
    memberId: string
  ): Promise<RefsetMember> {

    const url = `/snowstorm/${branch}/members/${memberId}`;
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': `${useApplicationConfigStore.getState().applicationConfig?.apLanguageHeader}`
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
    member: RefsetMember
  ): Promise<RefsetMember> {
    const {memberId} = member
    if (!memberId) this.handleErrors();

    const url = `/snowstorm/${branch}/members/${memberId}`;
    const response = await axios.put(url, member,
    {
      headers: {
        'Accept': 'application/json',
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
    member: RefsetMember
  ): Promise<RefsetMember> {
    const {referencedComponentId} = member
    if (!referencedComponentId) this.handleErrors();

    const url = `/snowstorm/${branch}/members`;
    const response = await axios.post(url, member,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const newMember = response.data as RefsetMember;

    return newMember;

  }
};

export default RefsetMembersService;
