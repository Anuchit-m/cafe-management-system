const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/cafe_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createAdmin() {
    try {
        // ลบ user เดิมก่อน (ถ้ามี)
        await User.deleteOne({ username: 'anuchit' });

        // สร้าง password hash ใหม่
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // สร้าง admin user
        const admin = new User({
            username: 'anuchit',
            password: hashedPassword,
            fullName: 'System Administrator',
            email: 'admin@example.com',
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully');
        console.log('Username: anuchit');
        console.log('Password: admin123');
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        mongoose.disconnect();
    }
}

createAdmin(); 