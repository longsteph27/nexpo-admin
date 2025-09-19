import { cookies } from 'next/headers';
import { directusAxios } from './directus';
import { User } from './directus';

export async function getServerUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('directus-session') || cookieStore.get('directus_session_token');
    
    if (!sessionCookie) {
      return null;
    }

    const response = await directusAxios.get('/users/me', {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.error('Server auth error:', error);
    return null;
  }
}

export async function isServerAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}
