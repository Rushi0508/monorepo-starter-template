import { cookies } from 'next/headers';

export async function getServerSessionToken() {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get('better-auth.session_token');
	if (!sessionCookie) return null;
	return sessionCookie.value;
}
