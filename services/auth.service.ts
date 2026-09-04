import { nanoid } from "nanoid";
import { storageGet, storageSet } from "@/lib/storage";
import { apiClient } from "@/services/api-client";
import type { UserAccount } from "@/types/auth";

interface StoredUser extends UserAccount {
  password: string;
}

const USERS = "users";
const SESSION = "session";

export const authService = {
  me: () => apiClient.get(() => storageGet<UserAccount | null>(SESSION, null)),
  login: (email: string, password: string) =>
    apiClient.mutate(() => {
      const users = storageGet<StoredUser[]>(USERS, []);
      const user = users.find((item) => item.email === email && item.password === password);
      if (!user) throw new Error("Invalid email or password");
      const session = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
      storageSet(SESSION, session);
      return session;
    }),
  register: (name: string, email: string, password: string) =>
    apiClient.mutate(() => {
      const users = storageGet<StoredUser[]>(USERS, []);
      if (users.some((item) => item.email === email)) throw new Error("An account already exists");
      const user: StoredUser = {
        id: nanoid(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      };
      storageSet(USERS, [...users, user]);
      const session = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
      storageSet(SESSION, session);
      return session;
    }),
  logout: () =>
    apiClient.mutate(() => {
      storageSet(SESSION, null);
    }),
  requestReset: (email: string) =>
    apiClient.mutate(() => {
      const users = storageGet<StoredUser[]>(USERS, []);
      if (!users.some((item) => item.email === email)) throw new Error("No account found");
      return true;
    }),
};
