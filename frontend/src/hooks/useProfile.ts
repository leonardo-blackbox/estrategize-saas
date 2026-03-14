import { useQuery } from '@tanstack/react-query';
import { client } from '../api/client.ts';
import { useAuthStore } from '../stores/authStore.ts';

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: 'member' | 'admin';
  email: string | null;
  created_at: string;
  avatar_url: string | null;
}

async function fetchProfile(): Promise<UserProfile> {
  return client.get('/auth/profile').json();
}

export function useProfile() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: fetchProfile,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnMount: 'always',  // always refetch role-sensitive data on mount
  });
}

export function useIsAdmin(): boolean {
  const { data } = useProfile();
  return data?.role === 'admin';
}
