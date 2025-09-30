const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.render('pages/login', { 
                error: 'ไม่พบชื่อผู้ใช้นี้',
                layout: 'layouts/main'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('pages/login', { 
                error: 'รหัสผ่านไม่ถูกต้อง',
                layout: 'layouts/main'
            });
        }

        // Set session
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.render('pages/login', { 
                    error: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
                    layout: 'layouts/main'
                });
            }
            res.redirect('/dashboard');
        });
    } catch (error) {
        console.error('Login error:', error);
        res.render('pages/login', { 
            error: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
            layout: 'layouts/main'
        });
    }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, fullName, email } = req.body;

    // ตรวจสอบรหัสผ่าน
    if (password !== confirmPassword) {
      return res.render('pages/register', { 
        error: 'รหัสผ่านไม่ตรงกัน',
        layout: 'layouts/main'
      });
    }

    // ตรวจสอบว่ามีชื่อผู้ใช้นี้แล้วหรือไม่
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('pages/register', { 
        error: 'มีชื่อผู้ใช้นี้ในระบบแล้ว',
        layout: 'layouts/main'
      });
    }

    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // สร้างผู้ใช้ใหม่
    const user = new User({
      username,
      password: hashedPassword,
      fullName,
      email,
      role: 'staff' // กำหนดค่าเริ่มต้นเป็น staff
    });

    await user.save();
    res.redirect('/?success=registered');
  } catch (error) {
    res.render('pages/register', { 
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      layout: 'layouts/main'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router; 