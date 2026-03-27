import { pgPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { AuthUser, LoginPayload, RegisterPayload } from '../models/auth.model';

export async function authenticateUser(payload: LoginPayload): Promise<AuthUser | null> {
  const client = await pgPool.connect();
  
  try {
    let query = '';
    let loginIdentifier = ''; // Biến này sẽ chứa Email hoặc Mã học sinh tùy role

    if (payload.role === 'teacher') {
      query = 'SELECT teacher_id AS id, email, name, password_hash, avatar_url FROM teacher WHERE email = $1 AND is_active = true';
      loginIdentifier = payload.email;
      
    } else if (payload.role === 'parent') {
      query = 'SELECT parent_id AS id, email, name, password_hash FROM parent WHERE email = $1 AND is_active = true';
      loginIdentifier = payload.email;
      
    } else if (payload.role === 'student') {
      // Học sinh thì query theo cột student_code
      // Gán tạm student_code vào trường email trả về để hệ thống JWT dùng chung khuôn
      query = 'SELECT student_id AS id, student_code AS email, name, password_hash FROM student WHERE student_code = $1 AND is_active = true';
      loginIdentifier = payload.student_code; 
    }

    // Truyền loginIdentifier (có thể là email, có thể là ID) vào $1
    const result = await client.query(query, [loginIdentifier]);
    const user = result.rows[0];

    // 2. Nếu không tìm thấy email
    if (!user) return null;

    // 3. So sánh mật khẩu người dùng nhập với hash trong DB
    const isPasswordValid = await bcrypt.compare(payload.password_raw, user.password_hash);
    if (!isPasswordValid) return null;

    // 4. Trả về thông tin AuthUser (Tuyệt đối không trả về password_hash)
    return {
      id: user.id,
      email: user.email, // Học sinh không có trường này nên sẽ bị null
      name: user.name,
      role: payload.role,
      avatar_url: user.avatar_url || null,
    };

  } catch (error) {
    console.error('Lỗi khi xác thực user:', error);
    throw new Error('Database query failed');
  } finally {
    client.release();
  }
}

export async function registerUser({ name, email, password_raw, role }: RegisterPayload) {
  const client = await pgPool.connect();
  
  try {
    // 1. Mã hóa mật khẩu (Băm 10 vòng cho an toàn)
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password_raw, saltRounds);

    let query = '';
    
    // 2. Chèn vào đúng bảng dựa theo Role và trả về thông tin user vừa tạo
    if (role === 'teacher') {
      query = `
        INSERT INTO teacher (name, email, password_hash, is_active) 
        VALUES ($1, $2, $3, true) 
        RETURNING teacher_id AS id, email, name;
      `;
    } else if (role === 'parent') {
      query = `
        INSERT INTO parent (name, email, password_hash, is_active) 
        VALUES ($1, $2, $3, true) 
        RETURNING parent_id AS id, email, name;
      `;
    }

    const result = await client.query(query, [name, email, password_hash]);
    const newUser = result.rows[0];

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: role,
    } as AuthUser;

  } catch (error: any) {
    // Bắt lỗi trùng Email (Mã lỗi 23505 của PostgreSQL)
    if (error.code === '23505') {
      throw new Error('Email này đã được đăng ký trong hệ thống!');
    }
    console.error('Lỗi khi đăng ký user:', error);
    throw new Error('Lỗi Database khi tạo tài khoản');
  } finally {
    client.release();
  }
}