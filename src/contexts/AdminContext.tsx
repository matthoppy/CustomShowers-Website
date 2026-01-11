/**
 * Admin Context
 * Manages admin authentication state
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminLogin, adminLogout, getAdminSession, isAdminAuthenticated } from '@/lib/adminAuth';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
}

interface AdminContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const session = getAdminSession();
    setUser(session);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await adminLogin(email, password);

    if (result.success && result.user) {
      setUser(result.user);
      return { success: true };
    }

    return { success: false, error: result.error };
  };

  const logout = () => {
    adminLogout();
    setUser(null);
  };

  return (
    <AdminContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
