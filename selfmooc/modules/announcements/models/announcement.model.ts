import { pgPool } from '@/lib/db';
import { getMongoDb } from '@/lib/db'; // Giả định bạn có file cấu hình MongoDB
import { ObjectId } from 'mongodb';

// ==========================================
// POSTGRESQL QUERIES
// ==========================================

// 1. Kiểm tra xem giáo viên có quyền ở lớp này không
export async function checkTeacherClassDB(teacherId: number, classId: number) {
  const client = await pgPool.connect();
  try {
    const query = 'SELECT 1 FROM class WHERE class_id = $1 AND teacher_id = $2 AND is_active = true';
    const result = await client.query(query, [classId, teacherId]);
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

// 2. Lấy danh sách ID học sinh trong lớp để gửi thông báo
export async function getEnrolledStudentsDB(classId: number) {
  const client = await pgPool.connect();
  try {
    const query = "SELECT student_id FROM enrollment WHERE class_id = $1 AND status = 'active'";
    const result = await client.query(query, [classId]);
    return result.rows.map(row => row.student_id);
  } finally {
    client.release();
  }
}

// Lấy danh sách các lớp học của một giáo viên
export async function getTeacherClassesDB(teacherId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT c.class_id, c.name, co.name as course_name, c.academic_year
      FROM class c
      JOIN course co ON c.course_id = co.course_id
      WHERE c.teacher_id = $1 AND c.is_active = true
    `;
    const result = await client.query(query, [teacherId]);
    return result.rows;
  } finally {
    client.release();
  }
}

// ==========================================
// MONGODB QUERIES
// ==========================================

// 3. Lưu thông báo vào Mongo
export async function createAnnouncementMongo(data: any) {
  const db = await getMongoDb();
  const result = await db.collection('class_announcement').insertOne({
    ...data,
    read_by: [], // Khởi tạo mảng trống
    created_at: new Date(),
    updated_at: new Date(),
  });
  return result.insertedId;
}

// 4. Tạo hàng loạt Notifications cho học sinh
export async function createNotificationsMongo(notifications: any[]) {
  if (notifications.length === 0) return;
  const db = await getMongoDb();
  await db.collection('notification').insertMany(notifications);
}

// 5. Lấy danh sách thông báo của một lớp
export async function getAnnouncementsByClassMongo(classId: number) {
  const db = await getMongoDb();
  return await db.collection('class_announcement')
    .find({ pg_class_id: classId })
    .sort({ created_at: -1 }) // Mới nhất lên đầu
    .toArray();
}