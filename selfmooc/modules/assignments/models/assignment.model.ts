import { pgPool } from '@/lib/db';

export async function createAssignmentDB(data: any, questionIds: number[]) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN'); // Bắt đầu Transaction để đảm bảo an toàn dữ liệu

    // 1. Tạo vỏ Bài Tập
    const insertAssignmentQuery = `
      INSERT INTO assignment (class_id, created_by, title, description, assignment_type, due_date, time_limit_min, total_points, is_published)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING assignment_id
    `;
    const assignmentValues = [
      data.class_id, data.teacher_id, data.title, data.description, 
      data.assignment_type, data.due_date, data.time_limit_min, questionIds.length // Tạm tính mỗi câu 1 điểm
    ];
    const res = await client.query(insertAssignmentQuery, assignmentValues);
    const assignmentId = res.rows[0].assignment_id;

    // 2. Móc nối các Câu hỏi (từ Ngân hàng) vào Bài tập này
    if (questionIds && questionIds.length > 0) {
      const insertAQQuery = `
        INSERT INTO assignment_question (assignment_id, question_id, display_order, points)
        VALUES ($1, $2, $3, $4)
      `;
      for (let i = 0; i < questionIds.length; i++) {
        await client.query(insertAQQuery, [assignmentId, questionIds[i], i + 1, 1]);
      }
    }

    await client.query('COMMIT'); // Lưu toàn bộ thay đổi
    return assignmentId;
  } catch (error) {
    await client.query('ROLLBACK'); // Nếu có lỗi ở bất kỳ bước nào, hoàn tác tất cả
    throw error;
  } finally {
    client.release();
  }
}

// Lấy danh sách Bài tập của một lớp
export async function getClassAssignmentsDB(classId: number) {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT a.*, 
             (SELECT COUNT(*) FROM assignment_question WHERE assignment_id = a.assignment_id) as question_count
      FROM assignment a 
      WHERE class_id = $1 
      ORDER BY created_at DESC
    `;
    const res = await client.query(query, [classId]);
    return res.rows;
  } finally {
    client.release();
  }
}

// Lấy thông tin lớp học để biết lớp này xài Khóa học (Course) nào
export async function getClassCourseIdDB(classId: number) {
  const client = await pgPool.connect();
  try {
    const res = await client.query('SELECT course_id FROM class WHERE class_id = $1', [classId]);
    return res.rows[0]?.course_id || null;
  } finally {
    client.release();
  }
}