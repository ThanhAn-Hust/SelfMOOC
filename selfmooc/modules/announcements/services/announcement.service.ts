import {
  checkTeacherClassDB,
  createAnnouncementMongo,
  getEnrolledStudentsDB,
  createNotificationsMongo,
  getAnnouncementsByClassMongo
} from '../models/announcement.model';

export async function createClassAnnouncementService(
  teacherId: number, 
  classId: number, 
  data: { title: string; body: string; attachments?: any[]; is_pinned?: boolean }
) {
  // 1. Kiểm tra giáo viên có quản lý lớp này không
  const isAuthorized = await checkTeacherClassDB(teacherId, classId);
  if (!isAuthorized) {
    throw new Error('❌ Bạn không có quyền gửi thông báo cho lớp học này!');
  }

  // 2. Lưu nội dung thông báo vào Mongo
  const announcementId = await createAnnouncementMongo({
    pg_class_id: classId,
    pg_teacher_id: teacherId,
    title: data.title,
    body: data.body,
    attachments: data.attachments || [],
    is_pinned: data.is_pinned || false,
  });

  // 3. Lấy danh sách học sinh đang active trong lớp
  const studentIds = await getEnrolledStudentsDB(classId);

  // 4. Chuẩn bị dữ liệu Notification cho từng học sinh
  const notifications = studentIds.map(studentId => ({
    recipient_id: studentId,
    recipient_type: 'student',
    type: 'class_announcement',
    title: `Thông báo mới từ lớp học: ${data.title}`,
    body: data.body.substring(0, 100) + '...', // Trích dẫn 1 đoạn ngắn
    payload: { announcement_id: announcementId, class_id: classId },
    channels: {
      in_app: { sent: true, read_at: null }
    },
    is_read: false,
    created_at: new Date(),
  }));

  // 5. Gửi Notification hàng loạt
  await createNotificationsMongo(notifications);

  return announcementId;
}

export async function getClassAnnouncementsService(classId: number) {
  return await getAnnouncementsByClassMongo(classId);
}