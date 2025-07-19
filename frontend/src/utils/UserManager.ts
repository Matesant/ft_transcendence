export interface UserProfile {
  id: number;
  alias: string;
  display_name?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export class UserManager {
  private static instance: UserManager;
  private userProfile: UserProfile | null = null;

  private constructor() {}

  public static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  public async fetchCurrentUser(): Promise<UserProfile | null> {
    try {
      // Detect the current host for API calls
      const host = window.location.hostname;
      const protocol = window.location.protocol;
      const apiUrl = `${protocol}//${host}:3003/users/me`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include', // Important for sending cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.userProfile = await response.json();
        console.log('User profile loaded:', this.userProfile);
        return this.userProfile;
      } else if (response.status === 401 || response.status === 403) {
        // User not authenticated - this is normal for guests
        console.log('User not authenticated, continuing as guest');
        return null;
      } else {
        console.warn('Unexpected response from user service:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      // Network error or service unavailable - continue as guest
      console.log('User service unavailable, continuing as guest');
      return null;
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.userProfile;
  }

  public getDisplayName(): string {
    if (!this.userProfile) {
      return 'Guest Player';
    }
    
    // Use display_name if available, otherwise use alias
    return this.userProfile.display_name || this.userProfile.alias || 'Player';
  }

  public getUserId(): string {
    if (!this.userProfile) {
      // Fallback to a generated ID for guest users
      return 'guest_' + Math.random().toString(36).substr(2, 9);
    }
    
    return this.userProfile.alias || this.userProfile.id.toString();
  }

  public isAuthenticated(): boolean {
    return this.userProfile !== null;
  }

  public getAvatar(): string | null {
    return this.userProfile?.avatar || null;
  }

  public clear(): void {
    this.userProfile = null;
  }
}
