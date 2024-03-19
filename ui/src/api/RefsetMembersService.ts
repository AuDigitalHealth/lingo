import axios from 'axios';
import { RefsetMember, RefsetMembersResponse } from '../types/RefsetMember.ts';

const RefsetMembersService = {
  handleErrors: () => {
    throw new Error('invalid refset members response');
  },
  async getRefsetMembers(
    branch: string,
  ): Promise<RefsetMembersResponse> {

    let referenceSet = "900000000000513000";
    let offset = 0;
    let limit = 200;

    const url = `/snowstorm/${branch}/members?referenceSet=${referenceSet}&offset=${offset}&limit=${limit}`;
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en-X-32570271000036106,en-X-900000000000509007,en-X-900000000000508004,en'
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
        'Accept-Language': 'en-X-32570271000036106,en-X-900000000000509007,en-X-900000000000508004,en'
      },
    });
    if (response.status != 200) {
      this.handleErrors();
    }

    const member = response.data as RefsetMember;

    return member;
  }
};

export default RefsetMembersService;
