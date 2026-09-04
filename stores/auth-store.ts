import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserAccount } from "@/types/auth";

interface AuthState {
  user: UserAccount | null;
  setUser: (user: UserAccount | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: "printo-auth" },
  ),
);
