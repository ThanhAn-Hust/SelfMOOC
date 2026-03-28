'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClassStudentsAction, addStudentToClassAction, removeStudentAction } from '@/modules/classes/controller/class.action';
import ClassAnnouncementPage from './ClassAnnouncementPage'; 

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const resolvedParams = use(params);
  const classId = parseInt(resolvedParams.classId);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'announcements' | 'students' | 'quizzes' | 'materials'>('students');
  
  // States cho Tab Học Sinh
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState('');

  const loadStudents = async () => {
    setIsLoading(true);
    const res = await getClassStudentsAction(classId);
    if (res.success) setStudents(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'students') loadStudents();
  }, [activeTab, classId]);

  // Xử lý thêm học sinh
  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);
    setMessage('');
    const formData = new FormData(e.currentTarget);
    formData.append('class_id', classId.toString());
    const res = await addStudentToClassAction(formData);
    setMessage(res.message);
    if (res.success) {
      (e.target as HTMLFormElement).reset();
      loadStudents();
    }
    setIsAdding(false);
  };

  // 🎯 Xử lý xóa học sinh (MỚI THÊM)
  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học sinh ${studentName} khỏi lớp không?`)) {
      const res = await removeStudentAction(classId, studentId);
      if (res.success) {
        setStudents(prev => prev.filter(s => s.student_id !== studentId)); // Xóa ngay trên UI
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* HEADER LỚP HỌC */}
      <button onClick={() => router.push('/classes')} className="mb-6 font-bold text-gray-500 hover:text-sky-500 flex items-center gap-2 transition-colors">
        <span>⬅</span> Quay lại danh sách lớp
      </button>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl shadow-xl p-8 mb-8 border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center text-4xl border-2 border-blue-500/50 shadow-inner">🏫</div>
          <div>
            <p className="text-blue-400 font-black text-sm uppercase tracking-widest mb-1">ID Lớp: #{classId}</p>
            <h1 className="text-3xl font-extrabold text-white">Quản Lý Lớp Học</h1>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('announcements')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'announcements' ? 'bg-sky-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>📢 Thông báo & Bài đăng</button>
        <button onClick={() => setActiveTab('students')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'students' ? 'bg-purple-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>👥 Danh sách Học sinh</button>
        <button onClick={() => setActiveTab('quizzes')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'quizzes' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>📝 Bài tập & Quiz</button>
        <button onClick={() => setActiveTab('materials')} className={`px-6 py-3 font-bold rounded-2xl transition-all whitespace-nowrap ${activeTab === 'materials' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>📚 Kho Học liệu</button>
      </div>

      {/* ========================================== */}
      {/* NỘI DUNG CÁC TABS */}
      {/* ========================================== */}

      {/* TAB 1: THÔNG BÁO */}
      {activeTab === 'announcements' && <ClassAnnouncementPage classId={classId} />}

      {/* TAB 2: QUẢN LÝ HỌC SINH */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 sticky top-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span>➕</span> Thêm học sinh</h2>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Mã học sinh (ID)</label>
                  <input name="student_code" required placeholder="VD: HS10293..." className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 text-white font-mono uppercase transition-colors" />
                </div>
                {message && <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.includes('thành công') || message.includes('🎉') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>{message}</div>}
                <button type="submit" disabled={isAdding} className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50">
                  {isAdding ? '⏳ ĐANG THÊM...' : 'THÊM VÀO LỚP'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="text-center py-20 text-slate-400 animate-pulse font-bold">Đang tải danh sách lớp...</div>
            ) : students.length === 0 ? (
              <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 border-dashed">
                <span className="text-5xl block mb-4">👻</span>
                <p className="text-slate-400 font-bold">Lớp học này chưa có học sinh nào.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between">
                  <span className="text-slate-400 font-bold text-sm">Sĩ số hiện tại: <span className="text-purple-400 text-lg">{students.length}</span></span>
                </div>
                {students.map((student) => (
                  <div key={student.student_id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center justify-between hover:border-purple-500/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-700 rounded-full overflow-hidden flex items-center justify-center text-xl">
                        {student.avatar_url ? <img src={student.avatar_url} alt="avt" className="w-full h-full object-cover" /> : '🐶'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{student.name}</h3>
                        <p className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded mt-1 inline-block">{student.student_code}</p>
                      </div>
                    </div>
                    {/* 🎯 Nút Xóa đã được gắn hàm */}
                    <button onClick={() => handleRemoveStudent(student.student_id, student.name)} className="w-10 h-10 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Xóa khỏi lớp">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BÀI TẬP VÀ QUIZ (Giao diện chờ API) */}
      {activeTab === 'quizzes' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><span>📝</span> Bài Tập Giao Cho Lớp</h2>
            <button className="px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all shadow-[0_4px_0_rgb(217,119,6)] active:translate-y-[2px] active:shadow-none">
              ➕ Soạn Bài Tập/Quiz
            </button>
          </div>
          <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 border-dashed">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa có bài tập nào được giao</h3>
            <p className="text-slate-500">Giáo viên có thể tạo câu hỏi mới hoặc lấy từ Ngân hàng đề của Khóa học.</p>
          </div>
        </div>
      )}

      {/* TAB 4: KHO HỌC LIỆU (Giao diện chờ API) */}
      {activeTab === 'materials' && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><span>📚</span> Học Liệu Tham Khảo</h2>
            <button className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[2px] active:shadow-none">
              ➕ Lấy tài liệu từ Khóa học
            </button>
          </div>
          <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 border-dashed">
            <span className="text-6xl mb-4 block">📂</span>
            <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa có tài liệu nào</h3>
            <p className="text-slate-500">Kéo thả các tài liệu (PDF, Video...) từ Khóa học sang đây để học sinh dễ dàng theo dõi.</p>
          </div>
        </div>
      )}

    </div>
  );
}