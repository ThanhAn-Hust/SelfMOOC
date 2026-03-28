import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '../../components/layout/Sidebar'; // Sửa lại đường dẫn import nếu cần
import Header from '../../components/layout/Header';

function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

export default async function ClassesLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) redirect('/login');

  const user = getUserFromToken(token);
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen bg-sky-50 overflow-hidden">
      {/* SIDEBAR */}
      <Sidebar role={user.role} />

      {/* CỘT BÊN PHẢI */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <Header user={user} />

        {/* NỘI DUNG CHÍNH (Sẽ render file page.tsx vào đây) */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
           
           <div className="relative z-10 h-full">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}