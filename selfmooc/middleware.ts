import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  // Nếu chưa đăng nhập mà vào '/', chuyển hướng sang '/login'
  if (pathname === '/' && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Nếu đã đăng nhập mà vào '/login', chuyển hướng sang '/'
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};
