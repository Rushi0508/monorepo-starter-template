import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/auth-client';

const AUTH_ROUTES = ['/login'];

export async function proxy(req: NextRequest) {
	const { pathname, search, origin } = req.nextUrl;
	const isAuthRoute = AUTH_ROUTES.includes(pathname);

	const session = await getSession({
		fetchOptions: { headers: req.headers },
	})
		.then(({ data }) => data)
		.catch(() => null);

	if (!session) {
		if (isAuthRoute) return NextResponse.next();
		const loginUrl = new URL('/login', origin);
		if (pathname !== '/') {
			loginUrl.searchParams.set('callbackURL', `${pathname}${search}`);
		}
		return NextResponse.redirect(loginUrl);
	}

	if (isAuthRoute) {
		return NextResponse.redirect(new URL('/', origin));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
