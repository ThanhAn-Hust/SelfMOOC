import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { SidebarProvider } from '../components/layout/SidebarContext';

function getUserFromToken(token: string) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null; 
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) {
    redirect('/login');
  }

  const user = getUserFromToken(token);

  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-sky-50 overflow-hidden relative">
        
        {/* Sidebar điều hướng */}
        <Sidebar role={user.role} />

        {/* CỘT BÊN PHẢI - Header & Nội dung chính */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          <Header user={user} />

          {/* KHU VỰC NỘI DUNG CHÍNH */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative z-10 h-full max-w-full">
              {children}
            </div>
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
}