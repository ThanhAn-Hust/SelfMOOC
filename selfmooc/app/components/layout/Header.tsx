'use client';

import Link from 'next/link';

// Truyền thông tin user vào để hiện lời chào (tên, avatar...)
export default function Header({ user }: { user?: any }) {
  // Hàm tạo lời chào theo buổi trong ngày cho thân thiện
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b-4 border-sky-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      
      {/* CỘT TRÁI: Lời chào */}
      <div className="flex items-center gap-3 animate-fade-in">
        <span className="text-3xl origin-bottom-right animate-wave">👋</span>
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{getGreeting()}</p>
          <h2 className="text-xl font-extrabold text-gray-800">
            {user?.name ? `${user.name} ơi!` : 'Nhà thám hiểm ơi!'}
          </h2>
        </div>
      </div>

      {/* CỘT PHẢI: Tìm kiếm, Thông báo & Avatar */}
      <div className="flex items-center gap-6">
        
        {/* Thanh tìm kiếm (Giả lập) */}
        <div className="hidden md:flex items-center bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-2 focus-within:border-blue-400 focus-within:bg-white transition-all">
          <span className="text-gray-400 mr-2">🔍</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm bài học..." 
            className="bg-transparent border-none focus:outline-none text-sm font-medium w-48"
          />
        </div>

        {/* Nút Thông báo */}
        <button className="relative p-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 hover:-translate-y-1 transition-all border-2 border-yellow-100">
          <span className="text-xl drop-shadow-sm">🔔</span>
          {/* Chấm đỏ báo có thông báo mới */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        </button>

        {/* Avatar Góc Phải (Bấm vào cũng ra trang Profile) */}
        <Link href="/profile">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-gradient-to-tr from-purple-400 to-blue-400 rounded-full p-1 shadow-md">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-2xl overflow-hidden">
                {/* 🎯 LOGIC AVATAR THÔNG MINH Ở ĐÂY */}
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.role === 'teacher' ? '👩‍🏫' : user?.role === 'parent' ? '👨‍👩‍👧' : '🐶'
                )}
              </div>
            </div>
          </div>
        </Link>
        
      </div>
    </header>
  );
}