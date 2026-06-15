export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
};

export type AuthSession = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
};

