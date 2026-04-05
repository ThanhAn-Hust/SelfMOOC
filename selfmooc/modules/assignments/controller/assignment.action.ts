'use server';

import { cookies } from 'next/headers';
import { createAssignmentDB, getClassAssignmentsDB, getClassCourseIdDB } from '../models/assignment.model';
import { ObjectId } from 'mongodb';
import { getMongoDb, pgPool } from '@/lib/db'; 

// Đọc Token quen thuộc
function getUserFromToken(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

// Lấy danh sách bài tập ra UI
export async function getClassAssignmentsAction(classId: number) {
  try {
    const data = await getClassAssignmentsDB(classId);
    return { success: true, data };
  } catch(e) { 
    return { success: false, data: [] }; 
  }
}

// Lấy ID Khóa học để load Ngân hàng câu hỏi
export async function getCourseIdOfClassAction(classId: number) {
  try {
    const courseId = await getClassCourseIdDB(classId);
    return { success: true, courseId };
  } catch(e) { 
    return { success: false, courseId: null }; 
  }
}

// Xử lý Form Tạo Bài Tập
export async function createAssignmentAction(formData: FormData, selectedQuestionIds: number[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const user = token ? getUserFromToken(token) : null;
  if (!user || user.role !== 'teacher') return { success: false, message: 'Không có quyền' };

  if (selectedQuestionIds.length === 0) {
    return { success: false, message: '⚠️ Vui lòng tick chọn ít nhất 1 câu hỏi từ Ngân hàng đề!' };
  }

  try {
    const dueDateStr = formData.get('due_date') as string;
    
    const payload = {
      class_id: Number(formData.get('class_id')),
      teacher_id: user.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      assignment_type: formData.get('assignment_type') || 'quiz',
      due_date: dueDateStr ? new Date(dueDateStr) : null,
      time_limit_min: Number(formData.get('time_limit_min')) || null,
    };

    if (!payload.title) return { success: false, message: 'Vui lòng nhập tên bài tập!' };

    await createAssignmentDB(payload, selectedQuestionIds);
    return { success: true, message: '✅ Đã giao bài tập thành công cho toàn bộ lớp!' };
  } catch (error: any) {
    return { success: false, message: 'Lỗi khi giao bài: ' + error.message };
  }
}

export async function getAssignmentForStudentAction(assignmentId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const client = await pgPool.connect();
  try {
    // 1. Lấy thông tin chung của Bài tập (Thời gian, Tên bài...)
    const assRes = await client.query('SELECT * FROM assignment WHERE assignment_id = $1', [assignmentId]);
    if (assRes.rows.length === 0) return { success: false, message: 'Không tìm thấy bài tập' };
    const assignment = assRes.rows[0];

    // 2. Lấy danh sách câu hỏi trong Postgres (Được nối qua bảng assignment_question)
    const qRes = await client.query(`
      SELECT q.question_id, q.question_type, q.mongo_id, aq.points, aq.display_order
      FROM assignment_question aq
      JOIN question q ON aq.question_id = q.question_id
      WHERE aq.assignment_id = $1
      ORDER BY aq.display_order ASC
    `, [assignmentId]);
    
    const pgQuestions = qRes.rows;
    if (pgQuestions.length === 0) return { success: true, data: { assignment, questions: [] } };

    // 3. Lấy Nội dung câu hỏi từ MongoDB
    const mongoIds = pgQuestions.map(q => new ObjectId(q.mongo_id));
    const db = await getMongoDb();
    const mongoQuestions = await db.collection('question_content').find({ _id: { $in: mongoIds } }).toArray();

    // 4. 🎯 THUẬT TOÁN "CHE MẮT" (Xóa đáp án đúng trước khi gửi về cho Học sinh)
    const safeQuestions = pgQuestions.map(pgQ => {
      const content = mongoQuestions.find(m => m._id.toString() === pgQ.mongo_id);
      
      // Bỏ qua nếu dữ liệu câu hỏi bên Mongo bị mất/lỗi
      if (!content) return null; 
      
      // 🎯 SỬA LỖI TYPESCRIPT: Ép kiểu thành 'any' để thoải mái xóa các key
      let safeContent: any = { ...content, _id: content._id.toString() };
      
      delete safeContent.correct_answer;
      delete safeContent.sample_answer;
      delete safeContent.explanation; // Xóa luôn cả lời giải thích (từ Schema)
      delete safeContent.rubric;      // Xóa luôn rubric chấm điểm (nếu có)
      
      if (safeContent.options && Array.isArray(safeContent.options)) {
        // Biến mảng options thành mảng an toàn (xóa trường is_correct)
        safeContent.options = safeContent.options.map((opt: any) => ({
          label: opt.label,
          text: opt.text
        }));
      }

      return {
        question_id: pgQ.question_id,
        question_type: pgQ.question_type,
        points: pgQ.points,
        content: safeContent
      };
    }).filter(q => q !== null); // Lọc bỏ các câu bị null

    return { success: true, data: { assignment, questions: safeQuestions } };    return { success: true, data: { assignment, questions: safeQuestions } };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi hệ thống khi tải đề thi' };
  } finally {
    client.release();
  }
}