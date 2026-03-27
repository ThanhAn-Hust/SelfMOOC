import nodemailer from 'nodemailer';

// Khởi tạo "bác bưu tá"
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm gửi thư chứa OTP
export async function sendOtpEmail(toEmail: string, otpCode: string) {
  const mailOptions = {
    from: `"SelfMOOC Admin" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Mã OTP Đổi Mật Khẩu của bạn',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 2px solid #fecdd3; border-radius: 16px; text-align: center;">
        <h2 style="color: #4b5563;">Xin chào nhà thám hiểm! 🚀</h2>
        <p style="color: #6b7280; font-size: 16px;">Bạn vừa yêu cầu đổi mật khẩu trên hệ thống SelfMOOC.</p>
        <p style="color: #6b7280; font-size: 16px;">Mã xác nhận (OTP) của bạn là:</p>
        
        <div style="background-color: #fff1f2; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <h1 style="color: #e11d48; letter-spacing: 10px; font-size: 36px; margin: 0;">${otpCode}</h1>
        </div>
        
        <p style="color: #ef4444; font-weight: bold;">⏳ Mã này sẽ tự hủy sau 5 phút.</p>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này để đảm bảo an toàn.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}