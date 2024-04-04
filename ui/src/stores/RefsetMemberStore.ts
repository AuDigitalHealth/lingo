import { create } from 'zustand';
import { RefsetMember } from '../types/RefsetMember.ts';

interface RefsetMemberStoreConfig {
  members: RefsetMember[];
  setMembers: (members: RefsetMember[]) => void;
  getMemberByReferencedComponentId: (referencedComponentId: string | undefined) => RefsetMember | undefined;
}

const useRefsetMemberStore = create<RefsetMemberStoreConfig>()((set, get) => ({
  members: [],
  setMembers: (members: RefsetMember[]) => {
    set({ members: [...members] });
  },
  getMemberByReferencedComponentId: (referencedComponentId: string | undefined) => {
    if (!referencedComponentId) return;
    let members = get().members;
    return members.find(m => m.referencedComponentId === referencedComponentId);
  },
}));

export default useRefsetMemberStore;
