import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/auth-client';

const authRoutes = ['/login'];

export async function proxy(req: NextRequest) {
	const { nextUrl } = req;
	const { pathname, origin } = nextUrl;
	const token = await getSession({
		fetchOptions: {
			headers: req.headers,
		},
	});

	if (!token.data) {
		if (authRoutes.includes(pathname)) {
			return NextResponse.next();
		}
		return NextResponse.redirect(new URL('/login', origin));
	}

	if (authRoutes.includes(pathname)) {
		return NextResponse.redirect(new URL('/', origin));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
