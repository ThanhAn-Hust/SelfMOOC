'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClassAnnouncementService, getClassAnnouncementsService } from '../services/announcement.service';
import { getTeacherClassesDB } from '../models/announcement.model';
import { getMongoDb } from '@/lib/db'; // Nhớ check đường dẫn file kết nối Mongo của bạn
import { ObjectId } from 'mongodb';

// Hàm helper để giải mã JWT (Giống các file cũ của bạn)
function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch (error) {
    return null;
  }
}

// ==========================================
// TẠO VÀ GỬI THÔNG BÁO MỚI (CHỈ DÀNH CHO GIÁO VIÊN)
// ==========================================
export async function createAnnouncementAction(classId: number, formData: any) {
  // 1. Xác thực người dùng
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') {
    return { success: false, message: 'Chỉ giảng viên mới được tạo thông báo' };
  }

  // 2. Validate dữ liệu đầu vào bằng Zod
  const schema = z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống'),
    body: z.string().min(1, 'Nội dung thông báo không được để trống'),
    is_pinned: z.boolean().optional(),
    // attachments: z.array(...).optional() - Có thể xử lý nếu có file đính kèm
  });

  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  // 3. Gọi Service thực thi nghiệp vụ
  try {
    await createClassAnnouncementService(user.id, classId, parsed.data);
    
    // Refresh lại trang lớp học để hiện thông báo mới
    revalidatePath(`/classes/${classId}`); 
    return { success: true, message: '🎉 Đã gửi thông báo đến toàn bộ lớp thành công!' };
  } catch (error: any) {
    console.error('Lỗi khi tạo thông báo:', error);
    return { success: false, message: error.message || 'Lỗi hệ thống khi gửi thông báo' };
  }
}

// ==========================================
// LẤY DANH SÁCH THÔNG BÁO CỦA LỚP
// ==========================================
export async function getAnnouncementsAction(classId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, data: [] };

  try {
    const announcements = await getClassAnnouncementsService(classId);
    return { success: true, data: announcements };
  } catch (error) {
    console.error(error);
    return { success: false, data: [], message: 'Không thể tải thông báo' };
  }
}

export async function getMyClassesAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, data: [] };

  const user = getUserFromToken(token);
  if (!user || user.role !== 'teacher') return { success: false, data: [] };

  try {
    const classes = await getTeacherClassesDB(user.id);
    return { success: true, data: classes };
  } catch (error) {
    return { success: false, data: [] };
  }
}

import { pgPool } from '@/lib/db';

// Lấy thông tin cơ bản của Lớp (Cần thiết để biết lớp này thuộc Course nào)
export async function getClassDetailAction(classId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT cl.*, c.name as course_name 
      FROM class cl 
      JOIN course c ON cl.course_id = c.course_id 
      WHERE cl.class_id = $1
    `;
    const res = await client.query(query, [classId]);
    return { success: true, data: res.rows[0] };
  } catch (error) {
    return { success: false, data: null };
  } finally {
    client.release();
  }
}

export async function deleteAnnouncementAction(announcementId: string) {
  try {
    const db = await getMongoDb();
    await db.collection('class_announcement').deleteOne({ _id: new ObjectId(announcementId) });
    
    // (Tùy chọn) Bạn có thể xóa luôn các notification rác liên quan đến thông báo này ở đây
    await db.collection('notification').deleteMany({ "payload.announcement_id": new ObjectId(announcementId) });
    
    return { success: true, message: '🗑️ Đã xóa thông báo thành công!' };
  } catch (error) {
    return { success: false, message: 'Lỗi khi xóa thông báo' };
  }
}

// CẬP NHẬT THÔNG BÁO
export async function updateAnnouncementAction(announcementId: string, data: any) {
  try {
    const db = await getMongoDb();
    await db.collection('class_announcement').updateOne(
      { _id: new ObjectId(announcementId) },
      { 
        $set: { 
          title: data.title, 
          body: data.body, 
          is_pinned: data.is_pinned,
          updated_at: new Date()
        } 
      }
    );
    return { success: true, message: '✅ Đã cập nhật thông báo!' };
  } catch (error) {
    return { success: false, message: 'Lỗi khi cập nhật' };
  }
}