import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { mockUsers } from "@/data/mockData";
import { signInWithEmail, signOut as supabaseSignOut, loginViaUsersTable } from "@/lib/supabaseAuth";
import { updateUserRecord, fetchUsers } from "@/lib/supabaseService";
import { supabase } from "@/lib/supabase";
import { User, UserRole } from "@/types";

const USERS_KEY = "@cricket360_users";
const SESSION_KEY = "@cricket360_session";
const SUPABASE_ENABLED = "@c360_supabase";

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  isLoading: boolean;
  useSupabase: boolean;
  login: (loginId: string, password: string, role: UserRole) => Promise<LoginResult>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [useSupabase, setUseSupabase] = useState(false);

  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    const init = async () => {
      const supabaseFlag = await AsyncStorage.getItem(SUPABASE_ENABLED);
      const enabled = supabaseFlag === "true" && !!SUPABASE_URL;
      setUseSupabase(enabled);

      if (enabled) {
        await initSupabaseAuth();
      } else {
        await initLocalAuth();
      }
      setIsLoading(false);
    };
    init();
  }, [SUPABASE_URL]);

  const initSupabaseAuth = async () => {
    try {
      const supabaseUsers = await fetchUsers();
      setAllUsers(supabaseUsers);
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        const user = supabaseUsers.find((u) => u.loginId === data.session!.user.email);
        if (user && user.status === "active") {
          setCurrentUser(user);
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user.id));
        }
      }
    } catch (e) {
      console.warn("[Supabase auth init]", e);
      await initLocalAuth();
    }
  };

  const initLocalAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      let users: User[];
      if (stored) {
        users = JSON.parse(stored);
      } else {
        users = mockUsers;
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
      setAllUsers(users);

      const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const sessionId = JSON.parse(sessionStr);
        const user = users.find((u) => u.id === sessionId);
        if (user && user.status === "active") {
          setCurrentUser(user);
        }
      }
    } catch (e) {
      console.warn("Auth init error:", e);
    }
  };

  const login = useCallback(
    async (loginId: string, password: string, role: UserRole): Promise<LoginResult> => {
      // Supabase mode: check the users table directly (app-level auth)
      if (useSupabase && SUPABASE_URL) {
        try {
          const rawUser = await loginViaUsersTable(loginId, password);
          if (rawUser) {
            const user: User = {
              id: rawUser.id,
              name: rawUser.name,
              role: rawUser.role,
              loginId: rawUser.login_id,
              password: rawUser.password,
              isFirstLogin: rawUser.is_first_login,
              status: rawUser.status,
              linkedId: rawUser.linked_id,
            };
            if (user.role !== role) {
              return { success: false, error: "This login ID does not match the selected role." };
            }
            if (user.status === "inactive") {
              return { success: false, error: "This account has been deactivated. Contact your admin." };
            }
            setCurrentUser(user);
            await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user.id));
            // Refresh the users list
            const supabaseUsers = await fetchUsers();
            setAllUsers(supabaseUsers);
            return { success: true };
          }
        } catch (e: any) {
          console.warn("[Supabase login]", e);
        }
        // If direct users-table lookup fails, try Supabase Auth (for admin only)
        try {
          await signInWithEmail(loginId, password);
          const supabaseUsers = await fetchUsers();
          setAllUsers(supabaseUsers);
          const user = supabaseUsers.find((u) => u.loginId === loginId && u.role === role);
          if (user) {
            setCurrentUser(user);
            await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user.id));
            return { success: true };
          }
        } catch (e: any) {
          // Supabase auth also failed
        }
        return { success: false, error: "Incorrect mobile number or password." };
      }

      // Local auth
      const user = allUsers.find(
        (u) => u.loginId === loginId && u.role === role
      );
      if (!user) {
        return { success: false, error: "This login ID does not match the selected role." };
      }
      if (user.status === "inactive") {
        return { success: false, error: "This account has been deactivated. Contact your admin." };
      }
      if (user.password !== password) {
        return { success: false, error: "Incorrect mobile number or password." };
      }
      setCurrentUser(user);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user.id));
      return { success: true };
    },
    [allUsers, useSupabase, SUPABASE_URL]
  );

  const logout = useCallback(async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
    if (useSupabase) {
      try {
        await supabaseSignOut();
      } catch (e) {
        console.warn("Supabase logout error:", e);
      }
    }
  }, [useSupabase]);

  const changePassword = useCallback(
    async (newPassword: string) => {
      if (!currentUser) return;
      const updatedUsers = allUsers.map((u) =>
        u.id === currentUser.id
          ? { ...u, password: newPassword, isFirstLogin: false }
          : u
      );
      const updatedUser = { ...currentUser, password: newPassword, isFirstLogin: false };
      setAllUsers(updatedUsers);
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      if (useSupabase) {
        try {
          // Update the users table so the next login via loginViaUsersTable sees the new password
          await updateUserRecord(currentUser.id, { password: newPassword, isFirstLogin: false });
        } catch (e) {
          console.warn("Supabase users-table password update failed", e);
        }
        try {
          const { updatePassword } = await import("@/lib/supabaseAuth");
          await updatePassword(newPassword);
        } catch (e) {
          console.warn("Supabase auth password update failed", e);
        }
      }
    },
    [currentUser, allUsers, useSupabase]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isFirstLogin: currentUser?.isFirstLogin ?? false,
        isLoading,
        useSupabase,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
