# SelfMOOC

SelfMOOC là một nền tảng học tập trực tuyến (MOOC) được xây dựng với các công nghệ web hiện đại. Nền tảng cho phép người dùng tham gia các khóa học, tương tác thời gian thực và quản lý dữ liệu linh hoạt bằng cách sử dụng kết hợp cả cơ sở dữ liệu SQL (PostgreSQL) và NoSQL (MongoDB).

## 🌐 Live Demo

- **Truy cập ứng dụng tại:** [https://selfmooc-deploy-iota.vercel.app/classes](https://selfmooc-deploy-iota.vercel.app/classes)

## 🚀 Công nghệ sử dụng

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router), React 19
- **Ngôn ngữ:** TypeScript / JavaScript
- **Styling:** Tailwind CSS v4, PostCSS
- **Cơ sở dữ liệu:**
  - **SQL:** PostgreSQL (trên [Neon](https://neon.tech/)) sử dụng package `pg`. Quản lý quan hệ dữ liệu phức tạp.
  - **NoSQL:** MongoDB (trên [MongoDB Atlas](https://www.mongodb.com/atlas)) sử dụng package `mongodb`. Quản lý dữ liệu linh hoạt, phi cấu trúc.
- **Real-time:** Socket.IO cho các tính năng thời gian thực.
- **Xác thực & Bảo mật:** `bcrypt`, `bcryptjs`, `jose` (JWT).
- **Tiện ích:** `nodemailer` (gửi email), `xlsx` (xử lý file Excel), `zod` (validation).

## 📁 Cấu trúc dự án

- `/selfmooc`: Chứa mã nguồn chính của ứng dụng Next.js.
  - `/app`: Chứa các trang (pages) và API routes theo chuẩn App Router của Next.js.
  - `/modules`, `/lib`: Chứa các logic nghiệp vụ, kết nối database và các hàm tiện ích.
  - `socket-server.js`: Cấu hình server Socket.IO để xử lý kết nối thời gian thực.
- `Relation.sql`: File mô tả cấu trúc, các bảng, và quan hệ của database PostgreSQL.
- `NoSql.js`: File chứa thông tin schema hoặc mock data liên quan đến MongoDB.

## 🛠 Hướng dẫn cài đặt và chạy nội bộ

### 1. Cài đặt thư viện

Di chuyển vào thư mục `selfmooc` và cài đặt các dependencies:

```bash
cd selfmooc
npm install
```

### 2. Cấu hình biến môi trường

Tạo một file `.env.local` ở trong thư mục `selfmooc` với các thông số cấu hình của bạn:

```env
# Database Connections
DATABASE_URL="postgres://user:password@endpoint.neon.tech/dbname"
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/dbname"

# JWT Secret
JWT_SECRET="your_secret_key"

# Email settings (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_password"
```

### 3. Chạy môi trường phát triển (Development)

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📦 Build và Deploy

Dự án hiện đang được deploy trên nền tảng **Vercel**. 

- Quá trình deploy Next.js lên Vercel diễn ra tự động và tối ưu rất tốt cho framework này.
- Mặc dù băng thông ở gói miễn phí có thể bị giới hạn, nhưng Vercel vẫn đáp ứng đầy đủ để chạy frontend Next.js cùng với API Routes.

Để build dự án cho môi trường production nội bộ:

```bash
npm run build
npm run start
```
*Lưu ý:* Nếu bạn muốn hỗ trợ tính năng WebSockets (Socket.IO) cùng với Next.js trên production, bạn sẽ gặp hạn chế do kiến trúc serverless của Vercel không hỗ trợ duy trì kết nối WebSocket liên tục tốt. Giải pháp là cấu hình chạy một server Node.js tùy chỉnh hoặc tách riêng Socket.IO ra một server khác (như VPS, Render) bằng cách chạy file `socket-server.js` song song.
