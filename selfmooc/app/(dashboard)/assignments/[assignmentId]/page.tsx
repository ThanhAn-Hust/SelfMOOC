'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAssignmentForStudentAction } from '@/modules/assignments/controller/assignment.action';
import { submitAssignmentAction } from '@/modules/assignments/controller/submission.action';

export default function TakeAssignmentPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = parseInt(resolvedParams.assignmentId);
  const router = useRouter();

  const [assignment, setAssignment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<{grade: string, needsManualGrading: boolean} | null>(null);

  useEffect(() => {
    async function loadData() {
      const res = await getAssignmentForStudentAction(assignmentId);
      if (res.success) {
        setAssignment(res.data?.assignment);
        setQuestions(res.data?.questions || []);
        if (res.data?.assignment?.time_limit_min) {
          setTimeLeft(res.data.assignment.time_limit_min * 60);
        }
      } else {
        alert(res.message);
        router.back();
      }
      setIsLoading(false);
    }
    loadData();
  }, [assignmentId, router]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft(t => (t !== null ? t - 1 : null)), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswerSelect = (questionId: number, answerValue: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerValue }));
  };

  const handleSubmit = async () => {
    if (window.confirm('Bạn có chắc chắn muốn nộp bài không?')) {
      setIsSubmitting(true);
      const timeSpentSec = assignment?.time_limit_min ? (assignment.time_limit_min * 60) - (timeLeft || 0) : 0;
      const res = await submitAssignmentAction(assignmentId, answers, timeSpentSec);
      if (res.success && res.data) {
        setResultData({ grade: res.data.grade, needsManualGrading: res.data.needsManualGrading });
      } else {
        alert(res.message || 'Lỗi khi nộp bài');
      }
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-2xl text-sky-500 animate-pulse">⏳ Đang tải đề thi...</div>;

  if (resultData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-slate-800 p-10 rounded-[3rem] border border-slate-700 text-center max-w-lg w-full shadow-2xl animate-fade-in">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-3xl font-black text-white mb-4">Nộp bài thành công!</h2>
          {!resultData.needsManualGrading && (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-3xl p-8 mb-8">
              <p className="text-sky-400 font-bold uppercase tracking-widest mb-2">Điểm số của bạn</p>
              <p className="text-7xl font-black text-sky-400">{resultData.grade}<span className="text-3xl text-sky-500/50">/10</span></p>
            </div>
          )}
          <button onClick={() => router.push(`/classes/${assignment.class_id}`)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-black rounded-2xl shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[4px] active:shadow-none">Trở về lớp học</button>
        </div>
      </div>
    );
  }

  return (
    // 🎯 SỬ DỤNG GRID 12 CỘT: Ép buộc hiển thị song song ngay từ kích cỡ md (768px) trở lên
    <div className="max-w-[1600px] mx-auto pb-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start px-4">
      
      {/* ⬅️ CỘT TRÁI (3/12): DANH MỤC & TIẾN ĐỘ */}
      {/* Sử dụng md:col-span-3 để đảm bảo luôn ở bên trái trên màn hình tablet/laptop */}
      <div className="md:col-span-3 space-y-6 md:sticky md:top-8 order-2 md:order-1">
        
        {/* Đồng hồ thời gian */}
        {timeLeft !== null && (
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
            <div className={`text-center p-4 rounded-2xl border-2 transition-colors ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 animate-pulse' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'}`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Thời gian còn lại</p>
              <p className="text-4xl font-black font-mono">{formatTime(timeLeft)}</p>
            </div>
          </div>
        )}

        {/* Bảng tiến độ */}
        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 pb-4 border-b border-slate-700/50 text-center">Tiến độ làm bài</p>
          <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 mb-8">
            {questions.map((q, idx) => (
              <button 
                key={q.question_id}
                onClick={() => document.getElementById(`question-${q.question_id}`)?.scrollIntoView({ behavior: 'smooth' })}
                className={`aspect-square rounded-xl font-black text-sm flex items-center justify-center border-2 transition-all ${
                  answers[q.question_id] !== undefined && answers[q.question_id] !== ''
                    ? 'bg-sky-500 border-sky-400 text-white shadow-[0_0_8px_rgba(14,165,233,0.4)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-[4px] active:shadow-none disabled:opacity-50"
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : '🚀 NỘP BÀI THI'}
          </button>
        </div>
      </div>

      {/* ➡️ CỘT PHẢI (9/12): NỘI DUNG CÂU HỎI */}
      <div className="md:col-span-9 space-y-6 order-1 md:order-2">
        
        {/* Thông tin bài tập */}
        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
          <h1 className="text-2xl font-black text-white mb-2">{assignment?.title}</h1>
          <p className="text-slate-400 text-sm">{assignment?.description}</p>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.question_id} id={`question-${q.question_id}`} className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl scroll-mt-24">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700/50">
                <h3 className="text-lg font-bold text-sky-400">Câu {index + 1} <span className="text-xs text-slate-500 font-normal ml-2">({q.points} điểm)</span></h3>
                <span className="text-[10px] font-bold bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 uppercase">{q.question_type.replace('_', ' ')}</span>
              </div>
              
              <div className="text-slate-200 font-medium text-lg mb-8 leading-relaxed">
                {q.content?.text}
              </div>

              {/* Trắc nghiệm 4 đáp án */}
              {q.question_type === 'multiple_choice' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.content?.options?.map((opt: any, optIdx: number) => {
                    const isSelected = answers[q.question_id] === optIdx;
                    return (
                      <button 
                        key={optIdx}
                        onClick={() => handleAnswerSelect(q.question_id, optIdx)} 
                        className={`flex items-center text-left gap-4 p-4 rounded-2xl border-2 transition-all outline-none ${
                          isSelected ? 'bg-sky-500/20 border-sky-500' : 'bg-slate-900/30 border-slate-700 hover:border-sky-500/50'
                        }`}
                      >
                        <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-sky-500 bg-sky-500' : 'border-slate-500'}`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <span className={`font-bold ${isSelected ? 'text-sky-300' : 'text-slate-400'}`}>{opt.label}. {opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Lựa chọn Đúng/Sai */}
              {q.question_type === 'true_false' && (
                <div className="flex gap-4">
                  <button onClick={() => handleAnswerSelect(q.question_id, true)} className={`flex-1 py-4 font-bold rounded-2xl border-2 transition-all ${answers[q.question_id] === true ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900/30 border-slate-700 text-slate-500 hover:border-emerald-500/50'}`}>ĐÚNG</button>
                  <button onClick={() => handleAnswerSelect(q.question_id, false)} className={`flex-1 py-4 font-bold rounded-2xl border-2 transition-all ${answers[q.question_id] === false ? 'bg-rose-50 border-rose-500 text-rose-400' : 'bg-slate-900/30 border-slate-700 text-slate-500 hover:border-rose-500/50'}`}>SAI</button>
                </div>
              )}

              {/* Câu hỏi tự luận */}
              {q.question_type === 'essay' && (
                <textarea rows={6} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 focus:border-sky-500 outline-none text-slate-200" value={answers[q.question_id] || ''} onChange={(e) => handleAnswerSelect(q.question_id, e.target.value)} placeholder="Nhập bài làm của bạn..."></textarea>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}