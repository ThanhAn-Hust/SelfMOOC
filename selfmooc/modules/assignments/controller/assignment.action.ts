'use server';

import { cookies } from 'next/headers';
import { createAssignmentDB, getClassAssignmentsDB, getClassCourseIdDB } from '../models/assignment.model';

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