import { apiUrl } from "./api";
import { navigateTo } from "../router/Router";

export interface UserProfile {
  id?: number;
  alias: string;
  display_name?: string | null;
  avatar?: string | null;
  wins?: number;
  losses?: number;
}

export interface AuthUser {
  id: number;
  alias: string;
  email: string;
  is_2fa_enabled: number;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch(apiUrl(3001, "/auth/verify"), {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data: {
      authenticated: boolean;
      user?: AuthUser;
      error?: string;
    } = await response.json();

    return data.authenticated && data.user ? data.user : null;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return null;
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch(apiUrl(3003, "/users/me"), {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    return data.profile || null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user) {
    navigateTo("/login");
    return null;
  }
  return user;
}

export function getDisplayName(profile: UserProfile): string {
  return profile.display_name && profile.display_name.trim() ? profile.display_name : profile.alias;
}

export async function getCurrentUserDisplayName(): Promise<string | null> {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile) {
      console.error("No profile found");
      return null;
    }
    
    if (!profile.alias) {
      console.error("Profile has no alias");
      return null;
    }
    
    const displayName = profile.display_name && profile.display_name.trim() ? profile.display_name : profile.alias;
    
    return displayName;
  } catch (error) {
    console.error("Error getting current user display name:", error);
    return null;
  }
}
