import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    // Bỏ qua các file tĩnh hoặc API
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    const isPublicRoute = pathname === '/login' || pathname === '/register';

    // Chưa đăng nhập mà vào route bảo vệ -> chuyển sang /login
    if (!session && !isPublicRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }

    // Đã đăng nhập mà vào /login -> chuyển sang trang chủ /
    if (session && isPublicRoute) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware execution error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};