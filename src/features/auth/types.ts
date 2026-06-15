export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  method: 'google';
  isPrivy: boolean;
};

export type AuthSession = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isReady: boolean;
  error: string | null;
};
