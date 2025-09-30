# Cafe Management System

โปรเจคระบบจัดการร้านกาแฟ (Cafe Management System) ที่พัฒนาด้วย Node.js และ Express Framework สำหรับวิชา Designing Web APIs with Node.js ปี 2

## ภาพรวมโปรเจค

โปรเจคนี้เป็นระบบจัดการร้านกาแฟที่ใช้

- **Node.js** - Runtime Environment หลัก
- **Express.js** - Web Framework สำหรับ Backend
- **MongoDB** - NoSQL Database สำหรับเก็บข้อมูล
- **EJS** - Template Engine สำหรับสร้าง User Interface
- **Bootstrap** - สำหรับ UI Components ที่สวยงาม
- **Mongoose** - ODM สำหรับ MongoDB
- **Express Session** - สำหรับจัดการ Session

## ฟีเจอร์หลัก

- 🔐 **ระบบล็อกอิน** - หน้าจอเข้าสู่ระบบพร้อมระบบจัดการผู้ใช้
- 📦 **จัดการเมนู** - เพิ่ม แก้ไข ลบ ดูรายการเมนูกาแฟและเบเกอรี่
- 💰 **ระบบสั่งซื้อ** - จัดการการสั่งซื้อและรายละเอียดการสั่งซื้อ
- 👥 **จัดการผู้ใช้** - ระบบจัดการผู้ใช้งาน (Admin/Staff)
- 📊 **รายงาน** - ดูรายงานการขายและสถิติ
- 🎨 **UI สวยงาม** - ใช้ Bootstrap Components และ Responsive Design

## โครงสร้างโปรเจค

```
cafe-management-system/
├── app.js                    # ไฟล์หลักของแอปพลิเคชัน
├── config/
│   └── db.js                # การตั้งค่าเชื่อมต่อ MongoDB
├── middleware/
│   └── auth.js              # Middleware สำหรับตรวจสอบสิทธิ์
├── models/
│   ├── User.js              # Model ผู้ใช้
│   ├── Menu.js              # Model เมนู
│   └── Order.js             # Model การสั่งซื้อ
├── routes/
│   ├── auth.js              # Routes สำหรับระบบล็อกอิน
│   ├── menu.js              # Routes สำหรับจัดการเมนู
│   ├── orders.js            # Routes สำหรับจัดการการสั่งซื้อ
│   ├── users.js             # Routes สำหรับจัดการผู้ใช้
│   └── reports.js           # Routes สำหรับรายงาน
├── views/
│   ├── layouts/
│   │   └── main.ejs         # Layout หลัก
│   └── pages/               # Views ต่างๆ
├── public/
│   ├── css/
│   │   └── style.css        # Custom CSS
│   ├── js/                  # JavaScript files
│   └── images/
│       └── menu/            # รูปภาพเมนู
└── create-admin.js          # Script สำหรับสร้าง Admin
```

## การติดตั้งและรันโปรแกรม

### ข้อกำหนดระบบ

- Node.js 14.x หรือสูงกว่า
- MongoDB 4.x หรือสูงกว่า
- npm หรือ yarn

### วิธีการติดตั้ง

1. **Clone repository นี้**
   ```bash
   git clone https://github.com/yourusername/cafe-management-system.git
   cd cafe-management-system
   ```

2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า environment**
   ```bash
   cp .env.example .env
   ```
   
   แก้ไขไฟล์ `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/cafe_management
   NODE_ENV=development
   PORT=3000
   ```

4. **เริ่มต้น MongoDB**
   - เปิด MongoDB service
   - หรือใช้ MongoDB Atlas สำหรับ cloud database

5. **สร้าง Admin User**
   ```bash
   node create-admin.js
   ```

6. **รันโปรเจค**
   ```bash
   npm start
   # หรือ
   npm run dev
   ```

7. **เปิดเบราว์เซอร์**
   ```
   http://localhost:3000
   ```

## วิธีการใช้งาน

1. **เข้าสู่ระบบ**
   - ใช้บัญชี Admin ที่สร้างไว้
   - หรือสร้างบัญชี Staff ใหม่

2. **จัดการเมนู**
   - เพิ่มเมนูกาแฟ, ชา, และเบเกอรี่
   - อัพโหลดรูปภาพเมนู
   - ตั้งราคาและรายละเอียด

3. **จัดการการสั่งซื้อ**
   - สร้างการสั่งซื้อใหม่
   - ติดตามสถานะการสั่งซื้อ
   - จัดการโต๊ะและลูกค้า

4. **ดูรายงาน**
   - ดูสถิติการขาย
   - รายงานรายวัน/รายเดือน
   - วิเคราะห์ข้อมูลการขาย

## Dependencies หลัก

- **express** - Web framework
- **mongoose** - MongoDB object modeling
- **ejs** - Template engine
- **express-session** - Session management
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **connect-mongo** - MongoDB session store
- **method-override** - HTTP method override

## API Endpoints

### Authentication
- `POST /auth/login` - เข้าสู่ระบบ
- `POST /auth/register` - สมัครสมาชิก
- `GET /auth/logout` - ออกจากระบบ

### Menu Management
- `GET /menu` - ดูรายการเมนู
- `POST /menu` - เพิ่มเมนูใหม่
- `PUT /menu/:id` - แก้ไขเมนู
- `DELETE /menu/:id` - ลบเมนู

### Order Management
- `GET /orders` - ดูรายการสั่งซื้อ
- `POST /orders` - สร้างการสั่งซื้อใหม่
- `PUT /orders/:id` - อัพเดทสถานะการสั่งซื้อ

### Reports
- `GET /reports` - ดูรายงานการขาย
- `GET /reports/daily` - รายงานรายวัน
- `GET /reports/monthly` - รายงานรายเดือน

## การพัฒนา

โปรเจคนี้พัฒนาขึ้นในปีการศึกษา 2567 สำหรับวิชา **Designing Web APIs with Node.js** ปี 2 โดยใช้ความรู้พื้นฐานในการเขียนโปรแกรม JavaScript และการพัฒนา Web Application ด้วย Node.js และ Express Framework

## หมายเหตุ

- โปรเจคนี้เป็นโปรเจคการศึกษา ไม่ได้ออกแบบสำหรับการใช้งานจริงในองค์กร
- ข้อมูลที่บันทึกจะถูกเก็บใน MongoDB database
- ระบบล็อกอินใช้ bcryptjs สำหรับการเข้ารหัสรหัสผ่าน
- รองรับการอัพโหลดรูปภาพเมนู

## ผู้พัฒนา

**นาย.อนุชิต มูลทองคำ**  
ปีการศึกษา: 2567  
มหาวิทยาลัยเทคโนโลยีมหานคร  
วิชา: Designing Web APIs with Node.js

## License

ISC License

---

สำหรับคำถามหรือข้อเสนอแนะ สามารถติดต่อได้ที่ [GitHub Issues](https://github.com/yourusername/cafe-management-system/issues)
