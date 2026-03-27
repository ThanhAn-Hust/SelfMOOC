'use server';

import { cookies } from 'next/headers';
import { pgPool } from '@/lib/db'; // Nhớ kiểm tra lại đường dẫn file kết nối DB của bạn
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mail';
// Hàm giải mã JWT (Dùng tạm cách này để lấy ID và Role)
function getUserFromToken(token: string) {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

// 1. HÀM LẤY THÔNG TIN CÁ NHÂN
// 1. HÀM LẤY THÔNG TIN CÁ NHÂN
export async function getProfileAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user) return { success: false, message: 'Token không hợp lệ' };

  const client = await pgPool.connect();
  try {
    let query = '';
    
    if (user.role === 'teacher') {
      // Giáo viên: Lấy full
      query = 'SELECT name, email, phone, dob, avatar_url FROM teacher WHERE teacher_id = $1';
    } else if (user.role === 'parent') {
      // Phụ huynh: Lấy full (Bảng parent không có avatar_url)
      query = 'SELECT name, email, phone, dob FROM parent WHERE parent_id = $1';
    } else if (user.role === 'student') {
      // Học sinh: Lấy tối giản
      query = 'SELECT name, dob, avatar_url, student_code FROM student WHERE student_id = $1';
    }

    const result = await client.query(query, [user.id]);
    
    return { 
      success: true, 
      data: result.rows[0], 
      role: user.role 
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi khi lấy thông tin' };
  } finally {
    client.release();
  }
}

// 2. HÀM CẬP NHẬT THÔNG TIN
export async function updateProfileAction(formData: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user) return { success: false, message: 'Token không hợp lệ' };

  // Xác thực dữ liệu
  const schema = z.object({
    name: z.string().min(1, 'Tên không được để trống'),
    phone: z.string().optional(),
    dob: z.string().optional(),
  });

  const parsed = schema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }

  const { name, phone, dob } = parsed.data;
  const dobValue = dob ? dob : null;

  const client = await pgPool.connect();
  try {
    if (user.role === 'teacher') {
      const query = 'UPDATE teacher SET name = $1, phone = $2, dob = $3, updated_at = NOW() WHERE teacher_id = $4';
      await client.query(query, [name, phone, dobValue, user.id]);
    } 
    else if (user.role === 'parent') {
      // Phụ huynh: Lưu Tên, Phone, Dob (Bảng parent của bạn không có cột updated_at)
      const query = 'UPDATE parent SET name = $1, phone = $2, dob = $3 WHERE parent_id = $4';
      await client.query(query, [name, phone, dobValue, user.id]);
    }
    else if (user.role === 'student') {
      // Học sinh: Chỉ lưu Tên
      const query = 'UPDATE student SET name = $1, dob = $2, updated_at = NOW() WHERE student_id = $3';
      await client.query(query, [name, dobValue, user.id]);
    }

    return { success: true, message: '🎉 Cập nhật hồ sơ siêu tốc thành công! 🚀' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi cập nhật DB' };
  } finally {
    client.release();
  }
}
// Gửi OTP đổi mật khẩu (Chỉ dành cho Teacher và Parent, Student không cần OTP)
export async function requestOtpAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user || user.role === 'student') return { success: false, message: 'Không hợp lệ' };

  // 1. Tạo ngẫu nhiên 6 số
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 2. GỬI MAIL THẬT ĐÂY NÀY! 
    await sendOtpEmail(user.email, otpCode);
    
    // 3. Nếu gửi thành công mới lưu Cookie
    cookieStore.set('reset_otp', otpCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 5 * 60, // 5 phút
      path: '/',
    });

    return { success: true, message: '📩 Đã gửi mã OTP. Vui lòng kiểm tra Hòm thư (hoặc Spam) nhé!' };
  } catch (error) {
    console.error('LỖI GỬI MAIL:', error);
    return { success: false, message: '❌ Lỗi hệ thống: Không thể gửi email lúc này.' };
  }
}

// ==========================================
// HÀM ĐỔI MẬT KHẨU
// ==========================================
export async function changePasswordAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return { success: false, message: 'Chưa đăng nhập' };

  const user = getUserFromToken(token);
  if (!user) return { success: false, message: 'Token không hợp lệ' };

  // Lấy 3 trường mật khẩu từ Form
  const oldPassword = formData.get('old_password') as string;
  const newPassword = formData.get('new_password') as string;
  const confirmPassword = formData.get('confirm_new_password') as string;
  const otpCodeInput = formData.get('otp_code') as string;

  // 1. Kiểm tra lính canh cơ bản
  if (!oldPassword) return { success: false, message: 'Vui lòng nhập mật khẩu cũ' };
  if (!newPassword || newPassword.length < 6) return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  if (newPassword !== confirmPassword) return { success: false, message: 'Mật khẩu xác nhận không khớp nha!' };

  // 2. Kiểm tra OTP (Dành cho người lớn)
  if (user.role === 'teacher' || user.role === 'parent') {
    const savedOtp = cookieStore.get('reset_otp')?.value;
    if (!savedOtp) return { success: false, message: 'Mã OTP đã hết hạn hoặc chưa được gửi' };
    if (savedOtp !== otpCodeInput) return { success: false, message: '❌ Mã OTP không chính xác' };
  }

  const client = await pgPool.connect();
  try {
    // 3. Lấy mật khẩu hiện tại trong Database ra để đối chiếu
    let getHashQuery = '';
    if (user.role === 'student') getHashQuery = 'SELECT password_hash FROM student WHERE student_id = $1';
    else if (user.role === 'teacher') getHashQuery = 'SELECT password_hash FROM teacher WHERE teacher_id = $1';
    else if (user.role === 'parent') getHashQuery = 'SELECT password_hash FROM parent WHERE parent_id = $1';

    const hashResult = await client.query(getHashQuery, [user.id]);
    if (hashResult.rows.length === 0) return { success: false, message: 'Không tìm thấy người dùng' };

    const currentHash = hashResult.rows[0].password_hash;
    
    // 4. So sánh Mật khẩu cũ user nhập với Hash trong DB
    const isMatch = await bcrypt.compare(oldPassword, currentHash);
    if (!isMatch) return { success: false, message: '❌ Mật khẩu cũ không chính xác!' };

    // 5. Nếu mọi thứ OK -> Băm pass mới và lưu
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    let updateQuery = '';
    if (user.role === 'student') updateQuery = 'UPDATE student SET password_hash = $1, updated_at = NOW() WHERE student_id = $2';
    else if (user.role === 'teacher') updateQuery = 'UPDATE teacher SET password_hash = $1, updated_at = NOW() WHERE teacher_id = $2';
    else if (user.role === 'parent') updateQuery = 'UPDATE parent SET password_hash = $1 WHERE parent_id = $2'; // Bảng parent ko có updated_at

    await client.query(updateQuery, [hashedNewPassword, user.id]);

    // Đổi thành công thì xóa luôn thẻ Cookie OTP đi cho sạch
    if (user.role === 'teacher' || user.role === 'parent') {
      cookieStore.delete('reset_otp');
    }

    return { success: true, message: '🎉 Đổi mật khẩu thành công rực rỡ!' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Lỗi hệ thống khi lưu mật khẩu' };
  } finally {
    client.release();
  }
}