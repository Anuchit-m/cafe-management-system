# Cafe Management System

โปรเจคระบบจัดการร้านกาแฟ (Cafe Management System) ที่พัฒนาด้วย Node.js และ Express Framework สำหรับวิชา Designing Web APIs with Node.js ปี 2

---

## 🚀 What's New — Renovation & New Features

### 🏗️ Renovated: Project Restructure & Upgrade

| ด้าน | ก่อนหน้า | ใหม่ |
|------|---------|------|
| Routes | `auth`, `menu`, `orders`, `users`, `reports` | เพิ่ม `selfOrder`, `tables`, `payment` |
| Views | หน้าพื้นฐาน | เพิ่ม self-order, tables, payment |
| Utils | ไม่มี | เพิ่ม `utils/receipt.js` |
| Security | ไม่มี rate limit | เพิ่ม `express-rate-limit` |

---

### ✨ New Features

#### 🛎️ Self-Order System (Customer QR Ordering)
- หน้า `self-order` ใหม่ทั้งหมด — ลูกค้าสแกน QR Code แล้วสั่งอาหาร/เครื่องดื่มเองได้
- ไม่ต้องล็อกอิน — ใช้ผ่านหน้าจอ tablet/มือถือ
- แสดงเมนูพร้อมรูปภาพ หมวดหมู่ และราคา
- มีตะกร้าสินค้า (Cart) และสรุปคำสั่งซื้อก่อนยืนยัน
- Route: `GET /self-orders/:tableId`

#### 🍽️ Table Management System
- จัดการโต๊ะในร้านแบบ Real-time
- สร้าง/แก้ไข/ลบโต๊ะ พร้อมกำหนดจำนวนที่นั่ง
- แสดงสถานะโต๊ะ (ว่าง / มีลูกค้า / กำลังสั่ง)
- สร้าง QR Code สำหรับแต่ละโต๊ะโดยอัตโนมัติ
- Model `Table.js` ใหม่

#### 💳 Payment System
- ระบบชำระเงินแยกออกจาก orders
- คำนวณยอดรวม ภาษี และส่วนลด
- บันทึกประวัติการชำระเงิน
- Route: `POST /payment/:orderId`

#### 🧾 Receipt Generator
- `utils/receipt.js` ใหม่ — สร้างใบเสร็จ/สรุปออร์เดอร์
- รองรับ format ที่พิมพ์ได้ (print-friendly)

#### 🛡️ Rate Limiting
- เพิ่ม `express-rate-limit` ป้องกัน brute-force และ spam requests

#### 🎨 Enhanced UI/UX
- Layout ใหม่ `views/layouts/tablet.ejs` สำหรับ Self-Order tablet mode
- `public/css/style.css` ปรับปรุงใหม่ครบทุก page
- Responsive design รองรับ desktop + tablet

---

## ภาพรวมโปรเจค

โปรเจคนี้เป็นระบบจัดการร้านกาแฟที่ใช้

- **Node.js** - Runtime Environment หลัก
- **Express.js** - Web Framework สำหรับ Backend
- **MongoDB** - NoSQL Database สำหรับเก็บข้อมูล
- **Mongoose** - ODM สำหรับ MongoDB
- **EJS** - Template Engine สำหรับสร้าง User Interface
- **Bootstrap** - สำหรับ UI Components ที่สวยงาม
- **Express Session** + **connect-mongo** - จัดการ Session
- **express-rate-limit** - ป้องกัน brute-force (**ใหม่**)
- **multer** - จัดการ File Upload

---

## ฟีเจอร์หลัก

🔐 **ระบบล็อกอิน** - หน้าจอเข้าสู่ระบบพร้อมระบบจัดการผู้ใช้ (Admin/Staff)

📦 **จัดการเมนู** - เพิ่ม แก้ไข ลบ ดูรายการเมนูกาแฟและเบเกอรี่ พร้อมอัปโหลดรูป

🛎️ **Self-Order QR** - ลูกค้าสั่งอาหารเองผ่าน QR Code (**ใหม่**)

🍽️ **จัดการโต๊ะ** - สถานะโต๊ะ Real-time + สร้าง QR Code (**ใหม่**)

💳 **ระบบชำระเงิน** - Payment flow ครบวงจร (**ใหม่**)

💰 **ระบบสั่งซื้อ** - จัดการ Orders และติดตามสถานะ

👥 **จัดการผู้ใช้** - ระบบ Role-based (Admin/Staff)

📊 **รายงาน** - ดูรายงานการขายและสถิติ

🧾 **ใบเสร็จ** - สร้าง Receipt อัตโนมัติ (**ใหม่**)

---

## โครงสร้างโปรเจค

```
cafe-management-system/
├── app.js                        # Entry point — Express config + Routes
├── .env.example                  # Template environment variables
├── package.json
├── config/
│   └── db.js                    # MongoDB connection (ต้องตั้งค่าเอง)
├── middleware/
│   └── auth.js                  # isAuthenticated, isAdmin middleware
├── models/
│   ├── User.js                  # User model (bcrypt password)
│   ├── Menu.js                  # Menu model
│   ├── Order.js                 # Order model
│   └── Table.js                 # Table model (ใหม่)
├── routes/
│   ├── index.js                 # Dashboard
│   ├── auth.js                  # Login / Register / Logout
│   ├── menu.js                  # Menu CRUD
│   ├── orders.js                # Order management
│   ├── selfOrder.js             # Self-order (QR) (ใหม่)
│   ├── tables.js                # Table management (ใหม่)
│   ├── payment.js               # Payment processing (ใหม่)
│   ├── users.js                 # User management
│   └── reports.js               # Sales reports
├── utils/
│   └── receipt.js               # Receipt generator (ใหม่)
├── views/
│   ├── layouts/
│   │   ├── main.ejs             # Main layout (Sidebar + Nav)
│   │   └── tablet.ejs           # Tablet layout สำหรับ Self-Order (ใหม่)
│   └── pages/
│       ├── dashboard.ejs
│       ├── login.ejs
│       ├── register.ejs
│       ├── error.ejs
│       ├── menu/index.ejs
│       ├── orders/index.ejs
│       ├── self-order/index.ejs  # QR Self-Order page (ใหม่)
│       ├── tables/index.ejs      # Table management (ใหม่)
│       ├── reports/index.ejs
│       └── users/index.ejs
└── public/
    ├── css/style.css
    ├── js/dashboard.js
    └── images/menu/             # รูปภาพเมนู
```

---

## การติดตั้งและรันโปรแกรม

### ข้อกำหนดระบบ

- Node.js 18.x หรือสูงกว่า
- MongoDB 6.x หรือสูงกว่า
- npm

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

3. **ตั้งค่า Environment**
   ```bash
   cp .env.example .env
   ```

   แก้ไขไฟล์ `.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/cafe_management
   SESSION_SECRET=your-long-random-secret-string-here
   BASE_URL=http://localhost:3000
   ```

4. **เริ่มต้น MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # หรือใช้ MongoDB Atlas (cloud) แล้วใส่ URI ใน MONGODB_URI
   ```

5. **รันโปรเจค**
   ```bash
   npm run dev
   ```

6. **เปิดเบราว์เซอร์**
   ```
   http://localhost:3000
   ```

---

## API Endpoints

### Authentication
| Method | Path | คำอธิบาย |
|--------|------|----------|
| `POST` | `/auth/login` | เข้าสู่ระบบ |
| `POST` | `/auth/register` | สมัครสมาชิก (Staff) |
| `GET` | `/auth/logout` | ออกจากระบบ |

### Menu Management
| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/menu` | ดูรายการเมนูทั้งหมด |
| `POST` | `/menu` | เพิ่มเมนูใหม่ |
| `PUT` | `/menu/:id` | แก้ไขเมนู |
| `DELETE` | `/menu/:id` | ลบเมนู |

### Tables *(ใหม่)*
| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/tables` | ดูสถานะโต๊ะทั้งหมด |
| `POST` | `/tables` | เพิ่มโต๊ะ |
| `PUT` | `/tables/:id` | อัปเดตสถานะโต๊ะ |
| `DELETE` | `/tables/:id` | ลบโต๊ะ |

### Self-Order *(ใหม่)*
| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/self-orders/:tableId` | หน้าสั่งอาหาร QR |
| `POST` | `/self-orders/:tableId/order` | ยืนยันคำสั่งซื้อ |

### Orders
| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/orders` | ดูรายการสั่งซื้อ |
| `POST` | `/orders` | สร้างการสั่งซื้อใหม่ |
| `PUT` | `/orders/:id` | อัปเดตสถานะ |

### Payment *(ใหม่)*
| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/payment/:orderId` | หน้าชำระเงิน |
| `POST` | `/payment/:orderId` | ยืนยันการชำระเงิน |

### Reports
| Method | Path | คำอธิบาย |
|--------|------|----------|
| `GET` | `/reports` | รายงานการขาย |
| `GET` | `/reports/daily` | รายงานรายวัน |
| `GET` | `/reports/monthly` | รายงานรายเดือน |

---

## Dependencies หลัก

```json
{
  "express": "^4.21.2",
  "mongoose": "^8.10.1",
  "ejs": "^3.1.10",
  "express-session": "^1.18.1",
  "connect-mongo": "^5.1.0",
  "bcryptjs": "^3.0.0",
  "multer": "^1.4.5-lts.1",
  "method-override": "^3.0.0",
  "express-rate-limit": "^8.5.2",
  "dotenv": "^16.4.7",
  "nodemon": "^3.1.9"
}
```

---

## หมายเหตุ

- **ไม่รวม** ไฟล์ `.env` ใน repository — ต้องสร้างเองจาก `.env.example`
- **ไม่รวม** `config/db.js` ที่มี connection string จริง — ต้องตั้งค่าใน `.env`
- โปรเจคนี้เป็นโปรเจคการศึกษา ไม่ได้ออกแบบสำหรับ production
- รองรับการอัปโหลดรูปภาพเมนูผ่าน multer
- ใช้ bcryptjs สำหรับการเข้ารหัสรหัสผ่าน

---

## การพัฒนา

โปรเจคนี้พัฒนาขึ้นในปีการศึกษา 2567 สำหรับวิชา **Designing Web APIs with Node.js** ปี 2

### เทคโนโลยีที่ใช้
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Template Engine**: EJS, express-ejs-layouts
- **Frontend**: Bootstrap, Vanilla JS
- **Auth**: express-session, bcryptjs
- **Security**: express-rate-limit

---

## ผู้พัฒนา

**นาย.อนุชิต มูลทองคำ**  
ปีการศึกษา: 2567  
มหาวิทยาลัยเทคโนโลยีมหานคร  
วิชา: Designing Web APIs with Node.js

---

## License

ISC License

---

*โปรเจคนี้สร้างขึ้นเพื่อการศึกษาและเรียนรู้การพัฒนา Web Application ด้วย Node.js และ Express*
