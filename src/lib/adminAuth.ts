/**
 * Admin Authentication Service
 * Simple password-based authentication for admin access
 */

import { supabase } from '@/integrations/supabase/client';

const ADMIN_SESSION_KEY = 'bfs_admin_session';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
}

/**
 * Login with email and password
 */
export async function adminLogin(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    // Query admin_users table
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, password_hash')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      return { success: false, error: 'Invalid credentials' };
    }

    // For now, using simple password comparison
    // In production, you'd use proper password hashing (bcrypt)
    // This is just for demo - you'll set password_hash directly in DB
    if (adminUser.password_hash !== password) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Store session
    const session = {
      id: adminUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
      loginTime: new Date().toISOString(),
    };

    sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

    return {
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
      },
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Logout admin user
 */
export function adminLogout(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

/**
 * Get current admin session
 */
export function getAdminSession(): AdminUser | null {
  const sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData);
    return {
      id: session.id,
      email: session.email,
      full_name: session.full_name,
    };
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}
