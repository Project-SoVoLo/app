import { create } from "zustand";

interface UserState {
  role: string | null;
  setRole: (role: string) => void;
  clearRole: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
  clearRole: () => set({ role: null }),
}));
