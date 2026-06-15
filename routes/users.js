const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Get all users
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.render('pages/users/index', {
            title: 'จัดการพนักงาน',
            layout: 'layouts/main',
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.render('pages/users/index', {
            title: 'จัดการพนักงาน',
            layout: 'layouts/main',
            users: [],
            error: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
        });
    }
});

// Create new user
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { username, password, fullName, email, role } = req.body;

        if (!username || !password){
            return res.status(400).json({message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'});
        }

        if (password.length<6){
            return res.status(400).json({message:'รหัสผ่านต้องมีอย่างน้อย 6 ตัว'})
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
        }

        const user = new User ({username,password,fullName,email,role});
        await user.save();
        
        res.redirect('/users');
    }catch (error){
        console.error('Error create user : ' ,error);
        res.status(500).json({message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'});
    }
});

// Update user
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { fullName, email, role, currentPassword, newPassword } = req.body;
        const updateData = { fullName, email, role };

        // ถ้ามีการเปลี่ยนรหัสผ่าน
        if (currentPassword && newPassword) {
            if (newPassword.length<6) {
                return res.status(400).json({message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว'})
            }

            const existingUser = await User.findById(req.params.id);
            if (!existingUser) {
                return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
            }

            const isMatch = await existingUser.comparePassword(currentPassword);
            if (!isMatch){
                return res.status(400).json({message:'รหัสผ่านเดิมไม่ถูกต้อง'})
            }

            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        await User.findByIdAndUpdate(req.params.id, updateData);
        res.json({ message: 'อัพเดทข้อมูลสำเร็จ' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' });
    }
});

// Delete user (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // Prevent deleting self
        if (req.params.id === String(req.session.user.id)) {
            return res.status(400).json({ message: 'ไม่สามารถลบบัญชีตัวเองได้' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if(!user){
            return res.status(404).json({message:'ไม่พบผู้ใช้นี้'})
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
    }
});

module.exports = router; 